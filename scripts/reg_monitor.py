"""Registration-open monitor — USA Fencing member portal.

Primary source: https://member.usafencing.org/search/tournaments — a public,
server-rendered list where each tournament shows its ID, dates, and registration
status ("Open registration closes on X" = OPEN, "Registration opens on X" = not
yet, "Happening now!" = in progress). We match that against the watch list
(all NACs + Diego's exported "going" events) and email/push the moment a watched
event flips to open, with the exact deep link member.usafencing.org/details/tournaments/{ID}.

reg_dates.json remains a fallback (known open dates) if a watched event isn't
found in the portal yet. reg_state.json de-dupes so each open is announced once.

Run from pwa/:  python scripts/reg_monitor.py
"""
import json
import os
import re
import smtplib
import sys
from datetime import date, datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from bs4 import BeautifulSoup

HERE = os.path.dirname(__file__)
PWA  = os.path.join(HERE, "..")
WATCHLIST = os.path.join(PWA, "watchlist.json")
REG_DATES = os.path.join(HERE, "reg_dates.json")
STATE     = os.path.join(PWA, "reg_state.json")

GMAIL_USER    = os.environ.get("GMAIL_USER", "")
GMAIL_PASS    = os.environ.get("GMAIL_APP_PASSWORD", "")
ALERT_TO      = os.environ.get("ALERT_TO", GMAIL_USER)
PUSH_ENDPOINT = os.environ.get("PUSH_ENDPOINT", "")   # phase 2

PORTAL   = "https://member.usafencing.org/search/tournaments"
DETAILS  = "https://member.usafencing.org/details/tournaments/{}"
HEADERS  = {"User-Agent": "Mozilla/5.0 (fencing-calendar registration monitor)"}
MONTHS   = {m: i for i, m in enumerate(
    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _parse_start(text):
    """'Aug 22 - 23, 2026' / 'Oct 9 - 12, 2026' -> date(2026, 10, 9)."""
    m = re.search(r"([A-Z][a-z]{2})\s+(\d{1,2}).*?(\d{4})", text)
    if not m:
        return None
    mon, day, year = m.group(1), int(m.group(2)), int(m.group(3))
    if mon not in MONTHS:
        return None
    try:
        return date(year, MONTHS[mon], day)
    except ValueError:
        return None


def fetch_portal(max_horizon_days=150, max_pages=15):
    """Scrape upcoming tournaments from the portal (sorted soonest-first).
    Stops once entries pass today+horizon, since reg only opens within months."""
    horizon = date.today() + timedelta(days=max_horizon_days)
    out = []
    for page in range(1, max_pages + 1):
        url = PORTAL if page == 1 else f"{PORTAL}?page={page}"
        try:
            html = requests.get(url, timeout=25, headers=HEADERS).text
        except requests.RequestException:
            break
        soup = BeautifulSoup(html, "html.parser")
        # Listing anchors use class "no-link d-block"; nav-menu links use "d-flex".
        anchors = soup.select('a.no-link.d-block[href*="/details/tournaments/"]')
        if not anchors:
            break
        page_max = None
        for a in anchors:
            mid = re.search(r"/details/tournaments/(\d+)", a.get("href", ""))
            if not mid:
                continue
            tid  = mid.group(1)
            name = a.get_text(strip=True)
            row  = a.find_parent("tr") or a.find_parent("td")
            row_txt = row.get_text(" ", strip=True) if row else ""
            start = _parse_start(row_txt)
            status_el = row.select_one("span.smaller") if row else None
            status = status_el.get_text(" ", strip=True) if status_el else ""
            low = status.lower()
            is_open = "open registration" in low or "registration closes" in low
            out.append({"id": tid, "name": name, "start": start,
                        "status": status, "is_open": is_open})
            if start and (page_max is None or start > page_max):
                page_max = start
        if page_max and page_max > horizon:
            break
    return out


def _norm(s):
    return re.sub(r"[^a-z0-9 ]", " ", (s or "").lower())


def match_portal(watch_ev, portal):
    """Find the portal entry for a watched event: same start date, plus a name/
    keyword sanity check. NACs match on date + 'north american cup'/'championship'."""
    try:
        wd = datetime.strptime(watch_ev["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return None
    same_day = [p for p in portal if p["start"] == wd]
    if not same_day:
        return None
    wn = _norm(watch_ev["name"])
    is_nac = "nac" in wn or "national" in wn or "championship" in wn
    for p in same_day:
        pn = _norm(p["name"])
        if is_nac and ("north american cup" in pn or "national championship" in pn):
            return p
    # fall back to token overlap for named (non-generic) events
    wtok = {t for t in wn.split() if len(t) > 3 and t not in ("division", "mens", "epee")}
    for p in same_day:
        ptok = set(_norm(p["name"]).split())
        if wtok and len(wtok & ptok) >= 2:
            return p
    if len(same_day) == 1 and not is_nac:
        return same_day[0]
    return None


def check():
    today     = date.today()
    watchlist = _load(WATCHLIST, {"events": []}).get("events", [])
    reg_dates = _load(REG_DATES, {"events": {}}).get("events", {})
    state     = _load(STATE, {"notified": []})
    notified  = set(state.get("notified", []))

    portal = fetch_portal()
    print(f"[reg-monitor] Portal entries scanned: {len(portal)}")

    opened = []
    for ev in watchlist:
        key = ev["name"] + "|open"
        if key in notified:
            continue

        via = url = None
        p = match_portal(ev, portal)
        if p and p["is_open"]:
            via = f"portal: {p['status']}"
            url = DETAILS.format(p["id"])
        else:
            # fallback: a known scheduled open date in reg_dates.json
            rd = reg_dates.get(ev["name"], {})
            ro = rd.get("reg_opens", "")
            if ro:
                try:
                    if today >= datetime.strptime(ro, "%Y-%m-%d").date():
                        via, url = "scheduled date", rd.get("reg_url", "")
                except ValueError:
                    pass

        if via:
            opened.append({**ev, "reg_url": url or "", "via": via})
            notified.add(key)

    if not opened:
        print("[reg-monitor] No new registrations open.")
        return 0

    print(f"[reg-monitor] {len(opened)} registration(s) just opened:")
    for ev in opened:
        print(f"  - {ev['name']} ({ev['via']})")

    send_email(opened, today)
    send_push(opened)

    state["notified"] = sorted(notified)
    state["updated"]  = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    _save(STATE, state)
    return 0


def send_email(events, today):
    if not GMAIL_USER or not GMAIL_PASS:
        print("[reg-monitor] Email skipped — GMAIL_USER / GMAIL_APP_PASSWORD not set.")
        return
    cards = ""
    for ev in events:
        link = (f'<a href="{ev["reg_url"]}" style="background:#16a34a;color:#fff;padding:8px 16px;'
                f'border-radius:6px;text-decoration:none;font-weight:bold">Register now →</a>'
                if ev.get("reg_url") else "")
        cards += f"""
        <div style="border:2px solid #16a34a;border-radius:8px;padding:16px;margin:12px 0;background:#f0fdf4">
          <div style="font-size:18px;font-weight:bold;color:#0f172a">🔔 Registration is OPEN — {ev['name']}</div>
          <div style="margin-top:6px;color:#6b7280">{ev.get('date','')} · {ev.get('loc','')}</div>
          <div style="margin-top:4px;color:#9ca3af;font-size:12px">{ev['via']}</div>
          <div style="margin-top:12px">{link}</div>
        </div>"""
    html = f"""<html><body style="font-family:Arial,sans-serif;max-width:640px;margin:auto">
      <div style="background:#0f172a;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">Registration Just Opened</h1>
        <p style="margin:4px 0 0;color:#93c5fd">Sign up now before it fills up.</p>
      </div>
      <div style="padding:16px;background:#fff">{cards}</div>
      <div style="background:#f3f4f6;padding:12px;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px">
        Auto-checked by your fencing calendar · {today.strftime('%B %d, %Y')}
      </div></body></html>"""
    plain = "Registration just opened:\n\n" + "\n".join(
        f"- {ev['name']} ({ev.get('loc','')}) — {ev.get('reg_url','')}" for ev in events)
    n = len(events)
    subject = (f"🔔 Registration OPEN — {events[0]['name']}" if n == 1
               else f"🔔 {n} registrations just opened")
    msg = MIMEMultipart("alternative")
    msg["Subject"], msg["From"], msg["To"] = subject, GMAIL_USER, ALERT_TO
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_USER, GMAIL_PASS)
        s.sendmail(GMAIL_USER, ALERT_TO, msg.as_string())
    print(f"[reg-monitor] Email sent to {ALERT_TO}.")


def send_push(events):
    if not PUSH_ENDPOINT:
        print("[reg-monitor] Push skipped — PUSH_ENDPOINT not configured (phase 2).")
        return
    try:
        requests.post(PUSH_ENDPOINT, json={
            "title": "🔔 Fencing registration open",
            "events": [{"name": e["name"], "url": e.get("reg_url", "")} for e in events],
        }, timeout=20)
        print("[reg-monitor] Push payload sent to backend.")
    except requests.RequestException as e:
        print(f"[reg-monitor] Push failed: {e}")


if __name__ == "__main__":
    sys.exit(check())

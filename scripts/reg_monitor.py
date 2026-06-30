"""Registration-open monitor.

Watches all NACs (from watchlist.json) plus any 'going' events Diego exported.
Fires an alert the moment an event's registration opens, detected by either:
  1. a known registration-open DATE being reached (reg_dates.json -> reg_opens), or
  2. best-effort: a 'Register' link appearing on the event's page (early-open signal).

Sends email via Gmail SMTP (creds from env / GitHub secrets). Push is a no-op
until a push backend is configured (PUSH_ENDPOINT). State is kept in
reg_state.json so each open is announced exactly once.

Run from the pwa/ dir:  python scripts/reg_monitor.py
"""
import json
import os
import re
import smtplib
import sys
from datetime import date, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests

HERE = os.path.dirname(__file__)
PWA  = os.path.join(HERE, "..")

WATCHLIST  = os.path.join(PWA, "watchlist.json")
REG_DATES  = os.path.join(HERE, "reg_dates.json")
STATE      = os.path.join(PWA, "reg_state.json")

GMAIL_USER = os.environ.get("GMAIL_USER", "")
GMAIL_PASS = os.environ.get("GMAIL_APP_PASSWORD", "")
ALERT_TO   = os.environ.get("ALERT_TO", GMAIL_USER)
PUSH_ENDPOINT = os.environ.get("PUSH_ENDPOINT", "")   # phase 2: worker URL

# Heuristics for the best-effort "register link appeared" check.
OPEN_SIGNALS  = ["register now", "sign up now", "registration is open", "register here"]
CLOSED_HINTS  = ["registration opens", "registration will open", "opens on", "coming soon"]


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _date_open(reg_opens: str, today: date) -> bool:
    if not reg_opens:
        return False
    try:
        return today >= datetime.strptime(reg_opens, "%Y-%m-%d").date()
    except ValueError:
        return False


def _scrape_open(url: str) -> bool:
    """Best-effort: True if the page looks like registration is live.
    Conservative — only fires on an explicit open signal, never on a closed hint."""
    if not url:
        return False
    try:
        html = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"}).text.lower()
    except requests.RequestException:
        return False
    if any(h in html for h in CLOSED_HINTS):
        return False
    return any(s in html for s in OPEN_SIGNALS)


def check():
    today     = date.today()
    watchlist = _load(WATCHLIST, {"events": []})
    reg_dates = _load(REG_DATES, {"events": {}}).get("events", {})
    state     = _load(STATE, {"notified": []})
    notified  = set(state.get("notified", []))

    opened = []
    for ev in watchlist.get("events", []):
        name = ev["name"]
        key  = name + "|open"
        if key in notified:
            continue

        rd  = reg_dates.get(name, {})
        via = None
        if _date_open(rd.get("reg_opens", ""), today):
            via = "scheduled date"
        elif _scrape_open(rd.get("reg_url", "")):
            via = "register link detected"

        if via:
            ev = {**ev, "reg_url": rd.get("reg_url", ""), "via": via}
            opened.append(ev)
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
        link = f'<a href="{ev["reg_url"]}" style="background:#16a34a;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Register now →</a>' if ev.get("reg_url") else ""
        cards += f"""
        <div style="border:2px solid #16a34a;border-radius:8px;padding:16px;margin:12px 0;background:#f0fdf4">
          <div style="font-size:18px;font-weight:bold;color:#0f172a">🔔 Registration is OPEN — {ev['name']}</div>
          <div style="margin-top:6px;color:#6b7280">{ev.get('date','')} · {ev.get('loc','')}</div>
          <div style="margin-top:4px;color:#9ca3af;font-size:12px">Detected via: {ev['via']}</div>
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
        f"- {ev['name']} ({ev.get('loc','')}) — {ev.get('reg_url','')}" for ev in events
    )

    n = len(events)
    subject = f"🔔 Registration OPEN — {events[0]['name']}" if n == 1 else f"🔔 {n} registrations just opened"

    msg = MIMEMultipart("alternative")
    msg["Subject"], msg["From"], msg["To"] = subject, GMAIL_USER, ALERT_TO
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_USER, GMAIL_PASS)
        s.sendmail(GMAIL_USER, ALERT_TO, msg.as_string())
    print(f"[reg-monitor] Email sent to {ALERT_TO}.")


def send_push(events):
    """Phase 2: POST to the push backend (Cloudflare Worker) which fans out
    web-push to Diego's subscribed devices. No-op until PUSH_ENDPOINT is set."""
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

"""Fetch Spain RFEE Senior Men's Epee events."""
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

URL = "https://app.skermo.org/calendar/public/rfee?setLang=es"


def fetch_rfee_events():
    resp = requests.get(URL, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    events = []

    for item in soup.select(".event-item, .calendar-event, [class*='event']"):
        text = item.get_text(" ", strip=True).lower()
        if "espada" not in text and "epee" not in text:
            continue
        if "abs" not in text and "absoluto" not in text:
            continue
        if "masculino" not in text and "mixto" not in text and "men" not in text:
            continue

        title_el = item.select_one("[class*='title'], h3, h4, strong")
        title = title_el.get_text(strip=True) if title_el else item.get_text(" ", strip=True)[:60]

        date_el = item.select_one("[class*='date'], time, [datetime]")
        date_str = ""
        if date_el:
            dt_attr = date_el.get("datetime", "") or date_el.get_text(strip=True)
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    date_str = datetime.strptime(dt_attr[:10], fmt).strftime("%Y-%m-%d")
                    break
                except Exception:
                    continue

        loc_el = item.select_one("[class*='location'], [class*='place'], [class*='city']")
        loc = loc_el.get_text(strip=True) if loc_el else "Spain"

        if not date_str:
            continue
        if date_str < "2026-08-01":
            continue

        events.append({
            "date": date_str,
            "name": title,
            "loc": loc if loc else "Spain",
            "tier": "training",
            "source": "RFEE",
        })

    return events


if __name__ == "__main__":
    evs = fetch_rfee_events()
    print(json.dumps(evs, indent=2))

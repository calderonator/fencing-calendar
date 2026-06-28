"""Fetch Senior Men's Epee local events from AskFred CSV."""
import csv
import io
import json
import requests
from datetime import datetime

URL = "https://www.askfred.net/tournaments.csv"

EPEE_TERMS   = ["epee", "épée", "epée", "epe"]
SENIOR_TERMS = ["senior", "open", "div i", "div ia", "division i", "d1a"]
EXCLUDE      = ["women", "female", "ladies", "cadet", "junior", "youth",
                "y10", "y12", "y14", "y8", "wheelchair", "para", "veteran",
                "vet ", "60+", "50+", "40+", "foil", "saber", "sabre"]


def _ok(val, terms):
    v = (val or "").lower()
    return any(t in v for t in terms)


def _bad(val):
    v = (val or "").lower()
    return any(t in v for t in EXCLUDE)


def fetch_askfred_events():
    resp = requests.get(URL, timeout=20)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))
    events = []
    for row in reader:
        keys = {k: v for k, v in row.items() if k is not None}
        name      = keys.get("tournament_name", "")
        date_raw  = keys.get("tournament_date", "")
        city      = keys.get("city", "")
        state     = keys.get("state", "")
        weapon    = keys.get("weapon", "")
        age_group = keys.get("age_group", "")
        gender    = keys.get("gender", "")

        combined = f"{name} {weapon} {age_group} {gender}".lower()

        if not _ok(combined, EPEE_TERMS):
            continue
        if _bad(combined):
            continue
        if not _ok(combined, SENIOR_TERMS):
            continue
        if gender and "female" in gender.lower():
            continue

        try:
            d = datetime.strptime(date_raw.strip(), "%Y-%m-%d")
            date_str = d.strftime("%Y-%m-%d")
        except Exception:
            continue

        loc = ", ".join(p for p in [city, state] if p)
        events.append({
            "date": date_str,
            "name": name,
            "loc": loc,
            "tier": "local",
            "source": "AskFred",
        })

    return events


if __name__ == "__main__":
    evs = fetch_askfred_events()
    print(json.dumps(evs, indent=2))

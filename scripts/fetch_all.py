"""Combine all event sources into pwa/events.json."""
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from fetch_askfred import fetch_askfred_events
from fetch_rfee import fetch_rfee_events

try:
    from fetch_fie import fetch_fie_events
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

OUT = os.path.join(os.path.dirname(__file__), "..", "events.json")


def main():
    events = []

    print("Fetching AskFred...")
    try:
        evs = fetch_askfred_events()
        print(f"  {len(evs)} AskFred events")
        events.extend(evs)
    except Exception as e:
        print(f"  AskFred failed: {e}")

    print("Fetching RFEE Spain...")
    try:
        evs = fetch_rfee_events()
        print(f"  {len(evs)} RFEE events")
        events.extend(evs)
    except Exception as e:
        print(f"  RFEE failed: {e}")

    if HAS_PLAYWRIGHT:
        print("Fetching FIE...")
        try:
            evs = fetch_fie_events()
            print(f"  {len(evs)} FIE events")
            events.extend(evs)
        except Exception as e:
            print(f"  FIE failed: {e}")
    else:
        print("Skipping FIE (playwright not installed)")

    # Deduplicate by date+name
    seen = set()
    unique = []
    for ev in sorted(events, key=lambda e: e["date"]):
        key = (ev["date"], ev["name"][:30].lower())
        if key not in seen:
            seen.add(key)
            unique.append(ev)

    payload = {
        "updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "events": unique,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(unique)} events to events.json")


if __name__ == "__main__":
    main()

"""Fetch Senior Men's Epee FIE World Cup / Satellite events using Playwright."""
import json
from playwright.sync_api import sync_playwright


def fetch_fie_events():
    events = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(
            "https://fie.org/competitions",
            wait_until="networkidle",
            timeout=30000,
        )

        # Uncheck everything except Epee + Men, then select Senior + 2026/2027
        # The page loads with some boxes pre-checked; click through filters
        page.wait_for_selector("table", timeout=15000)

        # Select Senior from category dropdown
        try:
            page.select_option("select[name*='category'], select[placeholder*='categor']", label="Senior")
        except Exception:
            pass

        # Select 2026/2027 season
        try:
            page.select_option("select[name*='season'], select[placeholder*='season']", label="2026/2027")
        except Exception:
            # Try clicking a dropdown that says "Select seas"
            try:
                page.click("text=Select seas")
                page.click("text=2026/2027")
            except Exception:
                pass

        # Click Search if there's a button
        try:
            page.click("button:has-text('Search')")
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass

        page.wait_for_timeout(3000)

        # Parse competition table
        rows = page.query_selector_all("table tr")
        for row in rows:
            cells = row.query_selector_all("td")
            if len(cells) < 4:
                continue
            texts = [c.inner_text().strip() for c in cells]
            # Columns: Competition | Place | Date | Weapon | Gender | Category | Event
            name = texts[0].replace("▶", "").strip()
            place = texts[1] if len(texts) > 1 else ""
            date_raw = texts[2] if len(texts) > 2 else ""
            weapon = texts[3] if len(texts) > 3 else ""
            gender = texts[4] if len(texts) > 4 else ""
            category = texts[5] if len(texts) > 5 else ""
            event_type = texts[6] if len(texts) > 6 else ""

            if "senior" not in category.lower():
                continue
            if "male" not in gender.lower() and "men" not in gender.lower():
                continue
            if "epee" not in weapon.lower():
                continue
            if "team" in event_type.lower():
                continue

            # Parse start date from "Start: DD-MM-YYYY"
            start_date = ""
            for part in date_raw.split("\n"):
                if "start" in part.lower():
                    raw = part.replace("Start:", "").strip()
                    try:
                        from datetime import datetime
                        d = datetime.strptime(raw, "%d-%m-%Y")
                        start_date = d.strftime("%Y-%m-%d")
                    except Exception:
                        start_date = raw

            if not start_date or not name:
                continue

            # Clean up location
            loc = place.replace("(", "").replace(")", "").strip()
            loc_parts = [p.strip() for p in loc.split("\n") if p.strip()]
            # loc_parts: ["City Name", "🏴 ABC"] — keep city + country code
            city = loc_parts[0] if loc_parts else ""
            country = loc_parts[-1].split()[-1] if len(loc_parts) > 1 else ""
            location = f"{city}, {country}" if country and country != city else city

            tier = "intl"
            if "world cup" in name.lower():
                tier = "worldcup"
            elif "grand prix" in name.lower():
                tier = "grandprix"
            elif "satellite" in name.lower():
                tier = "satellite"
            elif "championship" in name.lower() or "championship" in name.lower():
                tier = "championship"

            events.append({
                "date": start_date,
                "name": name,
                "loc": location,
                "tier": tier,
                "source": "FIE",
            })

        browser.close()
    return events


if __name__ == "__main__":
    evs = fetch_fie_events()
    print(json.dumps(evs, indent=2))

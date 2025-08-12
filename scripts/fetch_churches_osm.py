import os, sys, json, time, requests
from urllib.parse import urlencode

OVERPASS_URL = os.environ.get("OSM_OVERPASS_URL", "https://overpass-api.de/api/interpreter")

# Rough bounding boxes per state (TX as example). For more states, extend here or use Nominatim.
STATE_BBOX = {
    "TX": [25.837377, -106.645646, 36.500704, -93.508292],  # south, west, north, east
}

def overpass_query_bbox(bbox):
    s, w, n, e = bbox
    q = (
        "[out:json][timeout:60];\n"
        "("
        "node[\"amenity\"=\"place_of_worship\"][\"religion\"=\"christian\"]({s},{w},{n},{e});"
        "way[\"amenity\"=\"place_of_worship\"][\"religion\"=\"christian\"]({s},{w},{n},{e});"
        "relation[\"amenity\"=\"place_of_worship\"][\"religion\"=\"christian\"]({s},{w},{n},{e});"
        ");"
        "out center tags;"
    ).format(s=s, w=w, n=n, e=e)
    r = requests.post(OVERPASS_URL, data={'data': q})
    r.raise_for_status()
    return r.json()

def extract_row(elem, state):
    tags = elem.get("tags", {})
    name = tags.get("name") or ""
    denom = tags.get("denomination") or ""
    website = tags.get("website") or ""
    phone = tags.get("phone") or ""
    city = tags.get("addr:city") or ""
    address = " ".join(filter(None, [
        tags.get("addr:housenumber",""),
        tags.get("addr:street",""),
        tags.get("addr:city",""),
        state,
        tags.get("addr:postcode","")
    ])).strip()
    lat = elem.get("lat") or elem.get("center", {}).get("lat")
    lon = elem.get("lon") or elem.get("center", {}).get("lon")
    _id = f"osm-{elem.get('type','n')}-{elem.get('id')}"
    return {
        "id": _id,
        "name_en": name,
        "name_zh": "",
        "denomination": denom,
        "language": "",
        "city": city,
        "state": state,
        "address": address,
        "website": website,
        "phone": phone,
        "service_time": "",
        "intro_en": "",
        "intro_zh": "",
        "student_ministry": "FALSE",
        "map_url": f"https://www.openstreetmap.org/{elem.get('type','node')}/{elem.get('id')}",
        "lat": lat or "",
        "lng": lon or ""
    }

def fetch_state(state):
    bbox = STATE_BBOX.get(state)
    if not bbox:
        raise SystemExit(f"No bbox for state {state}. Add to STATE_BBOX in script.")
    data = overpass_query_bbox(bbox)
    rows = [extract_row(e, state) for e in data.get("elements", [])]
    return rows

def main(states):
    all_rows = []
    for st in states:
        try:
            rows = fetch_state(st)
            all_rows.extend(rows)
            time.sleep(1)
        except Exception as e:
            print(f"[WARN] {st}: {e}", file=sys.stderr)
    return all_rows

if __name__ == "__main__":
    states = sys.argv[1:] or ["TX"]
    rows = main(states)
    # Emit as CSV to stdout
    import csv, sys
    w = csv.DictWriter(sys.stdout, fieldnames=[
        "id","name_en","name_zh","denomination","language","city","state","address","website","phone",
        "service_time","intro_en","intro_zh","student_ministry","map_url","lat","lng"
    ])
    w.writeheader()
    for r in rows:
        w.writerow(r)

import os, sys, requests, math

API_KEY = os.environ.get("SCORECARD_API_KEY")  # get at https://api.data.gov/signup/

# College Scorecard field docs: https://collegescorecard.ed.gov/data/documentation/
# 'religious_affiliation' numeric codes include many Christian denominations (e.g., 24 Baptist, 54 Church of Christ, etc.).
CHRISTIAN_CODES = [
    21, 22, 24, 27, 28, 30, 34, 35, 36, 37, 39, 40, 41, 42, 43, 45, 47, 50, 52, 54, 57, 58, 60, 61, 64, 66
]

FIELDS = ",".join([
    "id","school.name","school.city","school.state","school.religious_affiliation","school.school_url",
    "location.lat","location.lon"
])

def fetch_page(page=0, per_page=100, state=None):
    params = {
        "api_key": API_KEY,
        "fields": FIELDS,
        "per_page": per_page,
        "page": page,
        "school.religious_affiliation__in": ",".join(map(str, CHRISTIAN_CODES)),
    }
    if state:
        params["school.state"] = state
    r = requests.get("https://api.data.gov/ed/collegescorecard/v1/schools", params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def fetch_all(state=None):
    first = fetch_page(0, state=state)
    total = first.get("metadata", {}).get("total", 0)
    per_page = first.get("metadata", {}).get("per_page", 100)
    pages = int(math.ceil(total / per_page)) if per_page else 1
    results = first.get("results", [])
    for p in range(1, pages):
        data = fetch_page(p, state=state)
        results.extend(data.get("results", []))
    return results

def shape_row(it):
    name = it.get("school.name","")
    city = it.get("school.city","")
    state = it.get("school.state","")
    url = it.get("school.school_url","") or ""
    lat = it.get("location.lat","") or ""
    lon = it.get("location.lon","") or ""
    # Simple heuristics; refine by hand later
    return {
        "id": f"scorecard-{it.get('id')}",
        "name_en": name,
        "name_zh": "",
        "types": "undergrad|graduate",
        "state": state,
        "city": city,
        "sevp": "FALSE",
        "i20": "FALSE",
        "boarding": "FALSE",
        "tuition_band_usd": "",
        "denomination": "Christian",
        "faith_required": "FALSE",
        "intl_office_url": url,
        "programs": "",
        "detail_en": "",
        "detail_zh": "",
        "lat": lat,
        "lng": lon
    }

def main(state=None):
    if not API_KEY:
        print("[ERROR] Missing SCORECARD_API_KEY env", file=sys.stderr)
        sys.exit(2)
    res = fetch_all(state=state)
    rows = [shape_row(x) for x in res]
    return rows

if __name__ == "__main__":
    st = sys.argv[1] if len(sys.argv) > 1 else None
    rows = main(state=st)
    import csv, sys
    w = csv.DictWriter(sys.stdout, fieldnames=[
        "id","name_en","name_zh","types","state","city","sevp","i20","boarding","tuition_band_usd",
        "denomination","faith_required","intl_office_url","programs","detail_en","detail_zh","lat","lng"
    ])
    w.writeheader()
    for r in rows:
        w.writerow(r)

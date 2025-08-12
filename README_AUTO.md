Auto Ingest Bundle — Campus Overseas
====================================

This bundle lets your repo automatically fetch:
- **Churches** from OpenStreetMap (Overpass API)
- **Christian colleges** from College Scorecard API (optionally filtered by state)

It writes two CSVs in the schema your site already uses:
- `auto/churches.csv`
- `auto/schools.csv`

Your site can then point `config.json` to these:
```
{
  "schools_csv_url": "/auto/schools.csv",
  "churches_csv_url": "/auto/churches.csv",
  "formspree_endpoint": "https://formspree.io/f/mkgzkrjd",
  "google_maps_api_key": ""
}
```
(Using relative paths means Vercel will serve the CSV and no CORS issues.)

---

Quick Setup
-----------
1) **Copy the entire bundle** into your repo root and commit.
2) In GitHub → Settings → Secrets and variables → Actions → **New repository secret**:
   - `SCORECARD_API_KEY`: get one free at https://api.data.gov/signup/ (choose College Scorecard API)
   - (Optional) `OSM_OVERPASS_URL`: default used if not set: https://overpass-api.de/api/interpreter
3) Your site will still work with Google Sheets now. When ready to switch to auto-CSV,
   edit `config.json` to the two relative URLs above.
4) The workflow runs **weekly**. You can also trigger **Run workflow** manually in Actions tab.

Initial Scope
-------------
- **States**: defaults to `["TX"]`. Edit `TARGET_STATES` in `scripts/build.py` to add more (e.g., all 50).
- **Churches**: pulled from OSM `amenity=place_of_worship` + `religion=christian` (+ optional denomination hints).
- **Schools**: uses College Scorecard to find institutions with a Christian `religious_affiliation` code (see script).

Files
-----
- `.github/workflows/auto_build.yml` — CI job to run weekly, write CSV, and commit.
- `scripts/fetch_churches_osm.py` — Overpass queries + shaping to CSV rows.
- `scripts/fetch_schools_scorecard.py` — Scorecard queries + shaping to CSV rows.
- `scripts/build.py` — Dispatcher that calls both, writes final CSVs under `/auto`.

CSV Schema (must match the website)
-----------------------------------
Schools:
id,name_en,name_zh,types,state,city,sevp,i20,boarding,tuition_band_usd,denomination,faith_required,intl_office_url,programs,detail_en,detail_zh,lat,lng

Churches:
id,name_en,name_zh,denomination,language,city,state,address,website,phone,service_time,intro_en,intro_zh,student_ministry,map_url,lat,lng

Notes
-----
- Some fields are best-effort (e.g., `denomination`, `website` for churches from OSM); you can complete/override in Google Sheets.
- `sevp`, `i20`, `boarding`, `faith_required`, `student_ministry` are set to sensible defaults (FALSE) — human curation recommended.
- To expand data sources (ATS, NCES), add new scripts and merge in `build.py`.

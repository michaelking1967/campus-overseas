import os, csv, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO = ROOT / "auto"
AUTO.mkdir(exist_ok=True)

# Choose target states (TX for pilot). Extend this list for more states.
TARGET_STATES = ["TX"]

def run(cmd):
  print("+", " ".join(cmd))
  return subprocess.check_output(cmd, text=True)

def write_csv(path, header, rows):
  with open(path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=header)
    w.writeheader()
    for r in rows:
      w.writerow(r)

def build_churches():
  all_rows = []
  for st in TARGET_STATES:
    out = run([sys.executable, "scripts/fetch_churches_osm.py", st])
    reader = csv.DictReader(out.splitlines())
    for r in reader:
      all_rows.append(r)
  header = ["id","name_en","name_zh","denomination","language","city","state","address","website","phone",
            "service_time","intro_en","intro_zh","student_ministry","map_url","lat","lng"]
  write_csv(AUTO / "churches.csv", header, all_rows)
  print(f"Wrote {len(all_rows)} churches → {AUTO / 'churches.csv'}")

def build_schools():
  all_rows = []
  for st in TARGET_STATES:
    out = run([sys.executable, "scripts/fetch_schools_scorecard.py", st])
    reader = csv.DictReader(out.splitlines())
    for r in reader:
      all_rows.append(r)
  header = ["id","name_en","name_zh","types","state","city","sevp","i20","boarding","tuition_band_usd",
            "denomination","faith_required","intl_office_url","programs","detail_en","detail_zh","lat","lng"]
  write_csv(AUTO / "schools.csv", header, all_rows)
  print(f"Wrote {len(all_rows)} schools → {AUTO / 'schools.csv'}")

if __name__ == "__main__":
  build_churches()
  build_schools()
  print("Done.")

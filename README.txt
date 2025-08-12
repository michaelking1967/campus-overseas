
Campus Overseas — Clean build (Sheets CMS + Formspree + Maps-ready)

Upload all files in this folder to your GitHub repo root (no extra subfolders).
Vercel will auto-deploy.

Edit config.json to set:
- schools_csv_url (already set to your CSV)
- churches_csv_url (already set to your CSV)
- formspree_endpoint (already set)
- google_maps_api_key (optional; needed for big map on churches list)

Data rules:
- Schools header: id,name_en,name_zh,types,state,city,sevp,i20,boarding,tuition_band_usd,denomination,faith_required,intl_office_url,programs,detail_en,detail_zh,lat,lng
- Churches header: id,name_en,name_zh,denomination,language,city,state,address,website,phone,service_time,intro_en,intro_zh,student_ministry,map_url,lat,lng
- Use TRUE/FALSE for booleans; use | to separate multi-values.


async function getConfig(){ const r=await fetch('config.json?_='+Date.now()); return r.json(); }

function parseCSV(text){
  const rows=[]; let cur='', row=[], q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c=='"'){ if(q&&n=='"'){ cur+='"'; i++; } else q=!q; }
    else if(c==',' && !q){ row.push(cur); cur=''; }
    else if((c=='\n'||c=='\r') && !q){ if(cur!==''||row.length){ row.push(cur); rows.push(row); row=[]; cur=''; } }
    else cur+=c;
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  const header = rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.length && r.some(x=>String(x).trim()!=='')).map(r=>{
    const o={}; header.forEach((h,i)=> o[h]=(r[i]||'').trim()); return o;
  });
}
async function fetchCSV(url){ const r=await fetch(url); if(!r.ok) throw new Error('CSV fetch fail '+r.status); const t=await r.text(); return parseCSV(t); }

// Schools
async function loadSchools(){
  const {schools_csv_url}=await getConfig();
  const rows=await fetchCSV(schools_csv_url);
  return rows.map(r=> ({
    id:r.id,name_en:r.name_en,name_zh:r.name_zh,
    types:(r.types||'').split('|').map(x=>x.trim()).filter(Boolean),
    state:r.state,city:r.city,
    sevp:(r.sevp||'').toUpperCase()==='TRUE',
    i20:(r.i20||'').toUpperCase()==='TRUE',
    boarding:(r.boarding||'').toUpperCase()==='TRUE',
    tuition_band_usd:r.tuition_band_usd,
    denomination:r.denomination, faith_required:(r.faith_required||'').toUpperCase()==='TRUE',
    intl_office_url:r.intl_office_url,
    programs:(r.programs||'').split('|').map(x=>x.trim()).filter(Boolean),
    detail:{en:r.detail_en, zh:r.detail_zh},
    lat: parseFloat(r.lat||''), lng: parseFloat(r.lng||'')
  }));
}

function renderSchoolList(items){
  const box=document.getElementById('results'); if(!box) return;
  if(!items.length){ box.innerHTML='<div class="small">没有匹配的院校 / No results.</div>'; return; }
  box.innerHTML=items.map(s=>`
    <div class="list-item">
      <strong>${s.name_zh||s.name_en} / ${s.name_en||''}</strong><br/>
      <span class="small">${s.city||''}, ${s.state||''} · ${(s.programs||[]).join(', ')} · I‑20: ${s.i20?'Yes':'No'} · SEVP: ${s.sevp?'Yes':'No'}</span><br/>
      <a class="cta" href="school.html?id=${encodeURIComponent(s.id)}">查看详情 / View</a>
    </div>`).join('');
}

(function initHome(){
  const phaseSel=document.getElementById('phase'); if(!phaseSel) return;
  loadSchools().then(data=>{
    const chips=[...document.querySelectorAll('.chip')];
    chips.forEach(ch=>ch.addEventListener('click',()=> ch.classList.toggle('active')));
    function tuitionInBand(s,band){
      if(!band) return true;
      const m=(s.tuition_band_usd||'').match(/(\d+)\s*k/i);
      const approx = m ? parseInt(m[1])*1000 : 999999;
      const [lo,hi]=band.split('-').map(x=>parseInt(x));
      return approx>=lo && approx<=hi;
    }
    function run(){
      const phase=document.getElementById('phase').value;
      const state=document.getElementById('state').value;
      const i20=document.getElementById('i20').value;
      const sevp=document.getElementById('sevp').value;
      const tuition=document.getElementById('tuition').value;
      const faith=document.getElementById('faith').value;
      const chipTypes=chips.filter(x=>x.classList.contains('active')).map(x=>x.getAttribute('data-type'));
      const res=data.filter(s=>{
        const tset = chipTypes.length? chipTypes.some(t=>s.types.includes(t)) : true;
        const phaseOk = phase? s.types.includes(phase):true;
        const stateOk = state? s.state===state:true;
        const i20Ok = i20? String(s.i20)===i20 : true;
        const sevpOk = sevp? String(s.sevp)===sevp : true;
        const tuitionOk = tuitionInBand(s, tuition);
        const faithOk = faith? String(s.faith_required)===faith : true;
        return tset && phaseOk && stateOk && i20Ok && sevpOk && tuitionOk && faithOk;
      });
      renderSchoolList(res);
    }
    document.getElementById('go').addEventListener('click', run);
    renderSchoolList(data);
  }).catch(err=>{
    const box=document.getElementById('results'); if(box) box.innerHTML='<div class="small">数据加载失败，请检查 config.json 和表格是否已发布为 CSV。</div>';
  });
})();

window.renderSchoolDetail = async function(){
  try{
    const id=new URLSearchParams(location.search).get('id');
    const list=await loadSchools();
    const s=list.find(x=>String(x.id)===String(id));
    const el=document.getElementById('detail');
    if(!s){ el.innerHTML='<p>Not found.</p>'; return; }
    const mapIframe = s.lat && s.lng
      ? `<iframe width="100%" height="360" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
           src="https://www.google.com/maps?q=${s.lat},${s.lng}&z=14&output=embed"></iframe>`
      : '';
    el.innerHTML=`
      <h1>${s.name_zh||''} / ${s.name_en||''}</h1>
      <div class="badge">${s.state||''}</div>
      ${s.i20?'<div class="badge">I‑20</div>':''}
      ${s.sevp?'<div class="badge">SEVP</div>':''}
      <div class="card" style="margin-top:12px">
        <strong>简介</strong><br/>
        <div>${(s.detail&&s.detail.zh)||''}</div>
        <div class="small" style="margin-top:6px">${(s.detail&&s.detail.en)||''}</div>
      </div>
      <div class="card" style="margin-top:12px">
        <strong>关键信息</strong>
        <ul>
          <li>宗派/信仰：${s.denomination||'-'}</li>
          <li>主要项目/学位：${(s.programs||[]).join(', ')}</li>
          <li>I‑20：${s.i20?'可发':'不可发'}</li>
          <li>SEVP：${s.sevp?'是':'否'}</li>
          <li>学费区间：${s.tuition_band_usd||'-'}</li>
          <li>国际生办公室：${s.intl_office_url?`<a href="${s.intl_office_url}" target="_blank">访问</a>`:'-'}</li>
        </ul>
      </div>
      ${mapIframe? `<div class="card" style="margin-top:12px"><strong>位置</strong><div class="mapbox">${mapIframe}</div></div>`:''}
    `;
  }catch(e){
    document.getElementById('detail').innerHTML='<p>加载失败，请稍后再试。</p>';
  }
};

// Churches
async function loadChurches(){
  const {churches_csv_url}=await getConfig();
  const rows=await fetchCSV(churches_csv_url);
  return rows.map(r=>({
    id:r.id,name_en:r.name_en,name_zh:r.name_zh,denomination:r.denomination,
    language:(r.language||'').split('|').map(x=>x.trim()).filter(Boolean),
    city:r.city,state:r.state,address:r.address,website:r.website,phone:r.phone,
    service_time:r.service_time,intro_en:r.intro_en,intro_zh:r.intro_zh,
    student_ministry:(r.student_ministry||'').toUpperCase()==='TRUE',
    map_url:r.map_url, lat:parseFloat(r.lat||''), lng:parseFloat(r.lng||'')
  }));
}

window.initChurchList = async function(withMap){
  const cfg=await getConfig();
  const data=await loadChurches();
  const states=[...new Set(data.map(x=>x.state).filter(Boolean))].sort();
  const denoms=[...new Set(data.map(x=>x.denomination).filter(Boolean))].sort();
  const langs=[...new Set(data.flatMap(x=>x.language||[]))].sort();
  const add=(id,arr)=>{const sel=document.getElementById(id); if(!sel) return; arr.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);});};
  add('state',states); add('denom',denoms); add('lang',langs);
  const box=document.getElementById('results');
  function render(list){
    if(!list.length){ box.innerHTML='<div class="small">没有匹配的教会 / No results.</div>'; return; }
    box.innerHTML=list.map(c=>`
      <div class="list-item">
        <strong>${c.name_zh||''} / ${c.name_en||''}</strong><br/>
        <span class="small">${c.address||''} · ${c.denomination||'-'} · ${(c.language||[]).join(', ')}</span><br/>
        <a class="cta" href="church.html?id=${encodeURIComponent(c.id)}">查看详情 / View</a>
      </div>`).join('');
  }
  function run(){
    const state=document.getElementById('state').value.trim();
    const city=(document.getElementById('city').value||'').trim().toLowerCase();
    const denom=document.getElementById('denom').value.trim();
    const lang=document.getElementById('lang').value.trim();
    const ministry=document.getElementById('ministry').value.trim();
    const res=data.filter(c=>{
      const okState=state? c.state===state:true;
      const okCity=city? (c.city||'').toLowerCase().includes(city):true;
      const okDenom=denom? (c.denomination||'')===denom:true;
      const okLang=lang? (c.language||[]).includes(lang):true;
      const okMin=ministry? String(c.student_ministry)===ministry:true;
      return okState && okCity && okDenom && okLang && okMin;
    });
    render(res);
    if(withMap) renderMap(res, cfg);
  }
  document.getElementById('go').addEventListener('click', run);
  render(data);
  if(withMap) renderMap(data, cfg);
};

function renderMap(list, cfg){
  const wrap=document.getElementById('mapWrap'); if(!wrap) return;
  wrap.innerHTML='';
  if(!cfg.google_maps_api_key){
    wrap.innerHTML='<div class="small" style="padding:10px">未配置 Google Maps API key。请在 config.json 填写 "google_maps_api_key" 以启用聚合地图。</div>';
    return;
  }
  const mapDiv=document.createElement('div'); mapDiv.style.width='100%'; mapDiv.style.height='100%'; wrap.appendChild(mapDiv);
  const script=document.createElement('script');
  script.src=`https://maps.googleapis.com/maps/api/js?key=${cfg.google_maps_api_key}`;
  script.onload=()=>{
    const center={lat:(list[0]&&list[0].lat)||32.7767, lng:(list[0]&&list[0].lng)||-96.7970};
    const map=new google.maps.Map(mapDiv,{center,zoom:5});
    list.filter(x=>!isNaN(x.lat)&&!isNaN(x.lng)).forEach(c=>{
      const m=new google.maps.Marker({position:{lat:c.lat,lng:c.lng}, map, title:c.name_en||c.name_zh});
      const info=new google.maps.InfoWindow({content:`<strong>${c.name_zh||''}</strong><br/>${c.address||''}`});
      m.addListener('click',()=>info.open({anchor:m, map}));
    });
  };
  document.body.appendChild(script);
}

window.renderChurchDetail = async function(){
  try{
    const id=new URLSearchParams(location.search).get('id');
    const list=await loadChurches();
    const c=list.find(x=>String(x.id)===String(id));
    const el=document.getElementById('detail');
    if(!c){ el.innerHTML='<p>Not found.</p>'; return; }
    const mapIframe = (c.lat && c.lng)
      ? `<iframe width="100%" height="360" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
           src="https://www.google.com/maps?q=${c.lat},${c.lng}&z=14&output=embed"></iframe>`
      : (c.map_url? `<iframe width="100%" height="360" style="border:0" loading="lazy" src="${c.map_url.replace('&','&amp;')}"></iframe>`:'');
    el.innerHTML=`
      <h1>${c.name_zh||''} / ${c.name_en||''}</h1>
      <div class="badge">${c.state||''}</div>
      <div class="badge">${c.denomination||'-'}</div>
      <div class="card" style="margin-top:12px">
        <strong>简介</strong><br/>
        <div>${c.intro_zh||''}</div>
        <div class="small" style="margin-top:6px">${c.intro_en||''}</div>
      </div>
      <div class="card" style="margin-top:12px">
        <strong>信息</strong>
        <ul>
          <li>地址：${c.address||'-'}</li>
          <li>城市/州：${c.city||'-'}, ${c.state||'-'}</li>
          <li>语言：${(c.language||[]).join(', ')}</li>
          <li>主日时间：${c.service_time||'-'}</li>
          <li>网站：${c.website?`<a href="${c.website}" target="_blank" rel="noopener">访问</a>`:'-'}</li>
        </ul>
      </div>
      ${mapIframe? `<div class="card" style="margin-top:12px"><strong>位置</strong><div class="mapbox">${mapIframe}</div></div>`:''}
    `;
  }catch(e){
    document.getElementById('detail').innerHTML='<p>加载失败，请稍后再试。</p>';
  }
};

// Formspree
(async function initForm(){
  const form=document.getElementById('contactForm'); if(!form) return;
  const cfg=await getConfig();
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg=document.getElementById('formMsg'); msg.textContent='发送中…';
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      const r=await fetch(cfg.formspree_endpoint, {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify(data)});
      if(r.ok){ msg.textContent='已发送！我们会尽快联系你。'; form.reset(); }
      else { msg.textContent='发送失败，请稍后再试或改用邮箱。'; }
    }catch(err){
      msg.textContent='网络错误，稍后再试。';
    }
  });
})();

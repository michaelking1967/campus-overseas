
const I18N = {
  zh: {
    "nav.schools":"院校",
    "nav.guide":"申请指引",
    "nav.faq":"常见问题",
    "nav.contact":"联系",
    "hero.title":"帮助中国学生申请美国教会学校",
    "hero.sub":"K–12 中小学 · 本科 · 研究生/博士 · 神学院",
    "search.title":"快速搜索",
    "search.phase_any":"阶段：全部",
    "search.undergrad":"本科",
    "search.grad":"研究生",
    "search.doc":"博士",
    "search.seminary":"神学院",
    "search.state_any":"州：全部",
    "search.i20_any":"I‑20：不限",
    "search.i20_yes":"可发 I‑20",
    "search.i20_no":"不可发 I‑20",
    "search.board_any":"住宿：不限",
    "search.board_yes":"寄宿/住校",
    "search.board_no":"走读/非住校",
    "search.go":"搜索",
    "guide.title":"如何申请",
    "guide.step1":"筛选学校",
    "guide.step1d":"按阶段/州/学费/是否发 I‑20/寄宿等条件初筛",
    "guide.step2":"准备材料",
    "guide.step2d":"成绩单、语言成绩、推荐信、资金证明、信仰声明（如需）",
    "guide.step3":"提交申请",
    "guide.step3d":"在线申请与费用，留意奖学金与截止日期",
    "guide.step4":"获取 I‑20",
    "guide.step4d":"学校发放 I‑20 后支付 SEVIS 费，预约面签",
    "faq.title":"常见问题",
    "faq.q1":"申请 K–12 是否必须监护人？",
    "faq.a1":"多数州要求未成年人有监护安排；寄宿学校通常提供宿舍与生活管理。",
    "faq.q2":"语言成绩可以用哪种？",
    "faq.a2":"常见有托福/雅思/多邻国；部分学校提供 ESL 过渡或免语言条件。",
    "faq.q3":"神学院是否必须基督徒与信仰声明？",
    "faq.a3":"多为必需；具体按各校要求提交见证与推荐信。",
    "faq.disclaimer":"本网站提供信息参考，并非移民/法律服务。请以学校官网为准。",
    "contact.title":"联系我们",
    "contact.name":"姓名",
    "contact.email":"邮箱",
    "contact.phase":"申请阶段",
    "contact.msg":"您的问题",
    "contact.send":"发送",
    "verse.ref":"约翰福音 3:16",
    "verse.text":"神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。"
  },
  en: {
    "nav.schools":"Schools",
    "nav.guide":"Guide",
    "nav.faq":"FAQ",
    "nav.contact":"Contact",
    "hero.title":"Helping Chinese students apply to U.S. Christian schools",
    "hero.sub":"K–12 · Undergraduate · Graduate/Doctoral · Seminaries",
    "search.title":"Quick search",
    "search.phase_any":"Phase: Any",
    "search.undergrad":"Undergrad",
    "search.grad":"Graduate",
    "search.doc":"Doctoral",
    "search.seminary":"Seminary",
    "search.state_any":"State: Any",
    "search.i20_any":"I‑20: Any",
    "search.i20_yes":"I‑20 Available",
    "search.i20_no":"No I‑20",
    "search.board_any":"Housing: Any",
    "search.board_yes":"Boarding/On‑campus",
    "search.board_no":"Day/Off‑campus",
    "search.go":"Search",
    "guide.title":"How to apply",
    "guide.step1":"Choose schools",
    "guide.step1d":"Filter by phase/state/tuition/I‑20/boarding",
    "guide.step2":"Prepare documents",
    "guide.step2d":"Transcripts, English scores, recommendations, funds, statement of faith (if required)",
    "guide.step3":"Submit application",
    "guide.step3d":"Apply online, mind scholarship and deadlines",
    "guide.step4":"Receive I‑20",
    "guide.step4d":"Pay SEVIS fee and book visa interview",
    "faq.title":"Frequently asked questions",
    "faq.q1":"Is a guardian required for K–12 applicants?",
    "faq.a1":"Most states require arrangements for minors; boarding schools often provide dorm life management.",
    "faq.q2":"Which English tests are accepted?",
    "faq.a2":"Commonly TOEFL/IELTS/Duolingo; some schools offer ESL or conditional admission.",
    "faq.q3":"Do seminaries require a Christian testimony/statement of faith?",
    "faq.a3":"Often yes; see each school’s policy.",
    "faq.disclaimer":"This site is informational only, not legal/immigration advice. Refer to official school websites.",
    "contact.title":"Contact us",
    "contact.name":"Name",
    "contact.email":"Email",
    "contact.phase":"Applying for",
    "contact.msg":"Your question",
    "contact.send":"Send",
    "verse.ref":"John 3:16",
    "verse.text":"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
  }
};

let lang = 'zh';

async function loadSchools(){
  const res = await fetch('schools.json');
  return await res.json();
}

function renderList(items){
  const box = document.getElementById('results');
  if(!items.length){ box.innerHTML = '<div class="small">没有匹配的院校 / No results.</div>'; return; }
  box.innerHTML = items.map(s => `
    <div class="list-item">
      <strong>${s.name_zh} / ${s.name_en}</strong><br/>
      <span class="small">${s.city}, ${s.state} · ${(s.programs||[]).join(', ')} · I‑20: ${s.i20 ? 'Yes' : 'No'}</span><br/>
      <a class="cta" href="school.html?id=${s.id}" target="_blank">查看详情 / View</a>
    </div>
  `).join('');
}

function translate(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const txt = I18N[lang][key];
    if(txt) el.textContent = txt;
  });
  const tag = document.getElementById('tagline');
  if(tag){
    tag.textContent = (lang==='zh')
      ? 'Assist Chinese Students Apply to Christian Schools'
      : '帮助中国学生申请美国教会学校';
  }
}

async function main(){
  translate();
  const data = await loadSchools();
  document.getElementById('go').addEventListener('click', () => {
    const phase = document.getElementById('phase').value;
    const state = document.getElementById('state').value;
    const i20 = document.getElementById('i20').value;
    const boarding = document.getElementById('boarding').value;
    const res = data.filter(s => {
      const matchPhase = phase ? s.types.includes(phase) : true;
      const matchState = state ? s.state === state : true;
      const matchI20 = i20 ? String(s.i20) === i20 : true;
      const matchBoard = boarding ? String(s.boarding) === boarding : true;
      return matchPhase && matchState && matchI20 && matchBoard;
    });
    renderList(res);
  });
  renderList(data);
  document.getElementById('langBtn').addEventListener('click', ()=>{
    lang = (lang==='zh') ? 'en' : 'zh';
    translate();
  });
}

main();

// レイナのチリ勉強アプリ - ロジック
"use strict";

const PASS = 7;          // 10問中7問でクリア
const QPER = 10;         // 1ステージの問題数
const TEST_N = 20;       // テストモードの問題数
const TEST_TIME = 10*60; // テストモードの制限時間（秒）
const SAVE_KEY = "reina-chiri-save-v1";

const REGION_LIST = ["北海道","東北","関東","中部","近畿","中国・四国","九州・沖縄"];

// ---------- セーブデータ ----------
function defaultSave(){
  return { japan:{}, world:{}, drill:{}, stamps:{}, mistakes:{},
           streak:{last:null,count:0}, testBest:null, worldUnlocked:false };
}
function load(){
  try{ return Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")); }
  catch(e){ return defaultSave(); }
}
function save(s){ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
let STATE = load();

function isJapanAllCleared(){
  return JAPAN_STAGES.every(st => STATE.japan[st.id] && STATE.japan[st.id].cleared);
}

// ---------- 連続学習記録（ストリーク） ----------
function dstr(d){ return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function bumpStreak(){
  const today = dstr(new Date());
  const y = new Date(); y.setDate(y.getDate()-1);
  const s = STATE.streak || {last:null,count:0};
  if(s.last===today) return;
  s.count = (s.last===dstr(y)) ? s.count+1 : 1;
  s.last = today;
  STATE.streak = s;
}
function streakDays(){
  const s = STATE.streak;
  if(!s || !s.last) return 0;
  const y = new Date(); y.setDate(y.getDate()-1);
  return (s.last===dstr(new Date()) || s.last===dstr(y)) ? s.count : 0;
}

// ---------- ユーティリティ ----------
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function sample(a,n){ return shuffle(a).slice(0,n); }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

// 4択を作る：正解＋誤答プール3つ（exp:解説）
function makeChoice(q, answer, pool, exp){
  const distract = sample(pool.filter(x=>x!==answer), 3);
  const options = shuffle([answer, ...distract]);
  return { type:"choice", q, options, answer: options.indexOf(answer), exp };
}
// curated形式 {q,a,choices,exp} → 出題形式
function curatedToQ(g){
  const options = shuffle([g.a, ...g.choices]);
  return { type:"choice", q:g.q, options, answer:options.indexOf(g.a), exp:g.exp };
}
// 書き取り問題の表記ゆれ吸収（空白除去＋ひらがな→カタカナ）
function normalizeAns(s){
  return (s||"").replace(/[\s　]/g,"")
    .replace(/[ぁ-ゖ]/g, ch=>String.fromCharCode(ch.charCodeAt(0)+0x60));
}

// ---------- にがて（間違えた問題）の記録 ----------
function serializeQ(q){
  if(q.type==="choice") return {type:"choice", q:q.q, a:q.options[q.answer], options:q.options.slice(), exp:q.exp};
  if(q.type==="input")  return {type:"input", q:q.q, accept:q.accept, ans:q.ans, exp:q.exp};
  if(q.type==="order")  return {type:"order", q:q.q, items:q.items};
  return null;
}
function recordMistake(q){
  const item = serializeQ(q);
  if(!item) return;
  STATE.mistakes[q.q] = item;
  const keys = Object.keys(STATE.mistakes);
  if(keys.length>80) delete STATE.mistakes[keys[0]]; // 古いものから捨てる
  save(STATE);
}
function clearMistake(q){
  if(STATE.mistakes[q.q]){ delete STATE.mistakes[q.q]; save(STATE); }
}
function mistakeCount(){ return Object.keys(STATE.mistakes).length; }

// ---------- 問題生成：日本編 ----------
function japanPrefs(stage){
  return PREFECTURES.filter(p => stage.regions.includes(p.region));
}
function buildJapanQuestions(stage){
  const prefs = japanPrefs(stage);
  const allCaps = PREFECTURES.map(p=>p.capital);
  const allMeib = PREFECTURES.map(p=>p.meibutsu);
  const allNames = PREFECTURES.map(p=>p.name);
  const pool = [];

  prefs.forEach(p=>{
    pool.push(makeChoice(`${p.name}の県庁所在地は？`, p.capital, allCaps, `${p.name}の県庁所在地は${p.capital}。`));
    pool.push(makeChoice(`県庁所在地が「${p.capital}」なのは？`, p.name, allNames, p.note));
    pool.push(makeChoice(`${p.name}の名産は？`, p.meibutsu, allMeib, p.note));
    pool.push(makeChoice(`${p.name}は何地方？`, p.region, REGION_LIST, p.note));
  });

  // 地形・気候クイズ（このステージの県/地方に関係するもの）
  GEO_QUIZ.forEach(g=>{
    const relevant = prefs.some(p=>p.name===g.a) || stage.regions.includes(g.a);
    if(relevant) pool.push(curatedToQ(g));
  });

  // 並べ替え：北から順（PREFECTURES配列の並び＝おおむね北→南）。1問は必ず入れる。
  let orderQ = null;
  if(prefs.length>=3){
    const picked = sample(prefs, Math.min(4, prefs.length));
    const items = picked.map(p=>({ label:p.name, value:PREFECTURES.indexOf(p) }));
    orderQ = { type:"order", q:"北にある順（上から）に並べよう", items };
  }
  if(orderQ){
    return shuffle([orderQ, ...sample(pool, Math.min(QPER-1, pool.length))]);
  }
  return sample(pool, Math.min(QPER, pool.length));
}

// ---------- 問題生成：海外編 ----------
function buildWorldQuestions(stage){
  const focus = COUNTRIES.find(c=>c.id===stage.countryId);
  const allCaps = COUNTRIES.map(c=>c.capital);
  const allNames = COUNTRIES.map(c=>c.name);
  const allFeat = COUNTRIES.map(c=>c.feature);
  const allFlags = COUNTRIES.map(c=>c.flag);
  const continents = [...new Set(COUNTRIES.map(c=>c.continent))];
  const pool = [];

  function qFor(c, emphasize){
    const arr = [
      makeChoice(`${c.name}の首都は？`, c.capital, allCaps, `${c.name}の首都は${c.capital}。${c.feature}`),
      makeChoice(`首都が「${c.capital}」の国は？`, c.name, allNames, c.feature),
      makeChoice(`${c.name}は何大陸（地域）にある？`, c.continent, continents, c.feature),
      makeChoice(`${c.name}の特ちょうに合うのは？`, c.feature, allFeat),
      { type:"choice", q:`${c.name}の国旗は？`,
        options: shuffle([c.flag, ...sample(allFlags.filter(f=>f!==c.flag),3)]),
        answer: -1, exp:`${c.name}の国旗は ${c.flag} 。` },
    ];
    // 国旗問題の正解indexを設定
    arr[4].answer = arr[4].options.indexOf(c.flag);
    return emphasize ? arr : arr.slice(0,3);
  }

  // 今の国を重点的に
  pool.push(...qFor(focus, true));
  // 復習：ほかの国からも出題
  sample(COUNTRIES.filter(c=>c.id!==focus.id), 6).forEach(c=> pool.push(...qFor(c,false)));

  // 並べ替え：北から順（緯度が大きいほど北）。1問は必ず入れる。
  const picked = sample(COUNTRIES, 4);
  const orderQ = { type:"order", q:"北にある順（上から）に並べよう",
    items: picked.map(c=>({ label:c.name, value:-c.lat })) };
  return shuffle([orderQ, ...sample(pool, QPER-1)]);
}

// ---------- 問題生成：深掘りドリル ----------
function buildDrillQuestions(stage){
  return sample(stage.quiz, Math.min(QPER, stage.quiz.length)).map(item=>
    item.type==="input"
      ? { type:"input", q:item.q, accept:item.accept, ans:item.ans, exp:item.exp }
      : curatedToQ(item)
  );
}

// ---------- 問題生成：にがて復習 ----------
function buildReviewQuestions(){
  const pool = Object.values(STATE.mistakes);
  return sample(pool, Math.min(QPER, pool.length)).map(m=>{
    if(m.type==="choice"){
      const options = shuffle(m.options);
      return { type:"choice", q:m.q, options, answer:options.indexOf(m.a), exp:m.exp };
    }
    return m; // input / order はそのまま（orderは表示時にシャッフルされる）
  });
}

// ---------- 問題生成：テストモード ----------
function buildTestQuestions(){
  const pool = [];
  const allCaps = PREFECTURES.map(p=>p.capital);
  const allMeib = PREFECTURES.map(p=>p.meibutsu);
  sample(PREFECTURES, 8).forEach(p=>{
    const qs = [
      makeChoice(`${p.name}の県庁所在地は？`, p.capital, allCaps, `${p.name}の県庁所在地は${p.capital}。`),
      makeChoice(`${p.name}の名産は？`, p.meibutsu, allMeib, p.note),
      makeChoice(`${p.name}は何地方？`, p.region, REGION_LIST, p.note),
    ];
    pool.push(qs[Math.floor(Math.random()*qs.length)]);
  });
  const cCaps = COUNTRIES.map(c=>c.capital);
  const continents = [...new Set(COUNTRIES.map(c=>c.continent))];
  sample(COUNTRIES, 6).forEach(c=>{
    const qs = [
      makeChoice(`${c.name}の首都は？`, c.capital, cCaps, `${c.name}の首都は${c.capital}。${c.feature}`),
      makeChoice(`${c.name}は何大陸（地域）にある？`, c.continent, continents, c.feature),
    ];
    pool.push(qs[Math.floor(Math.random()*qs.length)]);
  });
  sample(GEO_QUIZ, 5).forEach(g=> pool.push(curatedToQ(g)));
  DEEP_STAGES.forEach(st=> sample(st.quiz, 2).forEach(item=>{
    pool.push(item.type==="input"
      ? { type:"input", q:item.q, accept:item.accept, ans:item.ans, exp:item.exp }
      : curatedToQ(item));
  }));
  return sample(pool, Math.min(TEST_N, pool.length));
}

// ---------- 画面表示 ----------
const app = () => document.getElementById("app");

function setBG(mode){
  document.body.className = (mode==="japan"||mode==="world") ? mode : "";
}

// 経度緯度 → メルカトル図法のSVG座標（world-geo.js と同じ式）
const MERC_K = 360/(2*Math.PI);
function merc(lon, lat){
  lat = Math.max(-85, Math.min(84, lat));
  return { x: lon+180, y: 180 - MERC_K*Math.log(Math.tan(Math.PI/4 + lat*Math.PI/360)) };
}
function lonlat(c){ return merc(c.lon, c.lat); }

function renderHome(){
  stopTimer();
  setBG("");
  const unlocked = STATE.worldUnlocked || isJapanAllCleared();
  if(unlocked) STATE.worldUnlocked = true, save(STATE);
  const jpDone = JAPAN_STAGES.filter(s=>STATE.japan[s.id]&&STATE.japan[s.id].cleared).length;
  const wDone = WORLD_STAGES.filter(s=>STATE.world[s.id]&&STATE.world[s.id].cleared).length;
  const dDone = DEEP_STAGES.filter(s=>STATE.drill[s.id]&&STATE.drill[s.id].cleared).length;
  const stampCount = Object.keys(STATE.stamps).length;
  const nMistakes = mistakeCount();
  const streak = streakDays();

  const root = el("div","screen home");
  root.appendChild(el("div","logo","🌏 伶奈の地理勉強アプリ"));
  root.appendChild(el("p","tagline","日本を旅して、世界一周にでかけよう！"));
  root.appendChild(el("div","streak", streak>0
    ? `🔥 れんぞく学習 <b>${streak}日</b>${STATE.streak.last===dstr(new Date())?"（今日もクリア！）":"（今日もがんばろう！）"}`
    : "🔥 今日から連続記録をスタートしよう！"));

  // 日本編カード
  const jp = el("button","menu-card jp");
  jp.innerHTML = `<div class="mc-emoji">🗾</div>
    <div class="mc-body"><div class="mc-title">日本編</div>
    <div class="mc-sub">47都道府県をめぐる旅</div>
    <div class="mc-prog">クリア ${jpDone} / ${JAPAN_STAGES.length} 地方</div></div>`;
  jp.onclick = ()=>renderStageSelect("japan");
  root.appendChild(jp);

  // 海外編カード
  const w = el("button","menu-card world"+(unlocked?"":" locked"));
  if(unlocked){
    w.innerHTML = `<div class="mc-emoji">✈️</div>
      <div class="mc-body"><div class="mc-title">海外編 世界一周</div>
      <div class="mc-sub">世界20ヶ国をめぐろう</div>
      <div class="mc-prog">クリア ${wDone} / ${WORLD_STAGES.length} ヶ国</div></div>`;
    w.onclick = ()=>renderStageSelect("world");
  }else{
    w.innerHTML = `<div class="mc-emoji">🔒</div>
      <div class="mc-body"><div class="mc-title">海外編 世界一周</div>
      <div class="mc-sub">日本編をぜんぶクリアするとひらくよ</div>
      <div class="mc-prog">のこり ${JAPAN_STAGES.length-jpDone} 地方</div></div>`;
  }
  root.appendChild(w);

  // 深掘りドリル
  const d = el("button","menu-card drill");
  d.innerHTML = `<div class="mc-emoji">⛰️</div>
    <div class="mc-body"><div class="mc-title">深掘りドリル</div>
    <div class="mc-sub">自然・気候・産業・世界のすがた</div>
    <div class="mc-prog">クリア ${dDone} / ${DEEP_STAGES.length} テーマ</div></div>`;
  d.onclick = ()=>renderDrillSelect();
  root.appendChild(d);

  // にがて復習
  const r = el("button","menu-card review"+(nMistakes?"":" locked"));
  if(nMistakes){
    r.innerHTML = `<div class="mc-emoji">🔁</div>
      <div class="mc-body"><div class="mc-title">にがて復習</div>
      <div class="mc-sub">間違えた問題にもう一度ちょうせん</div>
      <div class="mc-prog">にがて ${nMistakes} 問</div></div>`;
    r.onclick = ()=>startQuiz("review", {id:"review", title:"にがて復習", emoji:"🔁"});
  }else{
    r.innerHTML = `<div class="mc-emoji">✨</div>
      <div class="mc-body"><div class="mc-title">にがて復習</div>
      <div class="mc-sub">間違えた問題がここにたまるよ</div>
      <div class="mc-prog">いまはゼロ！パーフェクト</div></div>`;
  }
  root.appendChild(r);

  // テストモード
  const t = el("button","menu-card test");
  t.innerHTML = `<div class="mc-emoji">📝</div>
    <div class="mc-body"><div class="mc-title">実力テスト</div>
    <div class="mc-sub">10分で20問・全範囲から出題</div>
    <div class="mc-prog">${STATE.testBest!=null? `さいこう記録 ${STATE.testBest} / ${TEST_N} 問` : "テスト前の力だめしに！"}</div></div>`;
  t.onclick = ()=>startQuiz("test", {id:"test", title:"実力テスト", emoji:"📝"});
  root.appendChild(t);

  // コレクション
  const col = el("button","menu-card col");
  col.innerHTML = `<div class="mc-emoji">🎒</div>
    <div class="mc-body"><div class="mc-title">おみやげコレクション</div>
    <div class="mc-prog">あつめた数 ${stampCount}</div></div>`;
  col.onclick = ()=>renderCollection();
  root.appendChild(col);

  app().innerHTML=""; app().appendChild(root);
}

function renderStageSelect(mode){
  stopTimer();
  if(mode==="world"){ setBG("world"); } else { setBG("japan"); }
  const stages = mode==="japan"? JAPAN_STAGES : WORLD_STAGES;
  const store = mode==="japan"? STATE.japan : STATE.world;

  const root = el("div","screen select");
  const head = el("div","select-head");
  const back = el("button","back","← もどる"); back.onclick=renderHome;
  head.appendChild(back);
  head.appendChild(el("h2",null, mode==="japan"?"🗾 日本編":"✈️ 海外編 世界一周"));
  root.appendChild(head);

  if(mode==="world"){
    root.appendChild(renderWorldMap());
  }

  const grid = el("div","stage-grid");
  stages.forEach((st,i)=>{
    const rec = store[st.id]||{};
    const prevCleared = i===0 || (store[stages[i-1].id]&&store[stages[i-1].id].cleared);
    const open = mode==="japan"? true : prevCleared; // 海外編は順番に解放
    const b = el("button","stage-card"+(rec.cleared?" cleared":"")+(open?"":" locked"));
    const sub = mode==="japan"
      ? japanPrefs(st).length+"県・都・道・府"
      : (COUNTRIES.find(c=>c.id===st.countryId).continent);
    b.innerHTML = `<div class="sc-emoji">${open?st.emoji:"🔒"}</div>
      <div class="sc-title">${st.title}</div>
      <div class="sc-sub">${open?sub:"前をクリアでひらく"}</div>
      ${rec.cleared?`<div class="sc-badge">★ ${rec.best}/${QPER}</div>`:""}`;
    if(open) b.onclick = ()=>startQuiz(mode, st);
    grid.appendChild(b);
  });
  root.appendChild(grid);

  app().innerHTML=""; app().appendChild(root);
}

// 深掘りドリルのステージ選択（全ステージ最初からひらいている）
function renderDrillSelect(){
  stopTimer();
  setBG("");
  const root = el("div","screen select");
  const head = el("div","select-head");
  const back = el("button","back","← もどる"); back.onclick=renderHome;
  head.appendChild(back);
  head.appendChild(el("h2",null,"⛰️ 深掘りドリル"));
  root.appendChild(head);

  const groups = [...new Set(DEEP_STAGES.map(s=>s.group))];
  groups.forEach(g=>{
    root.appendChild(el("h3","col-h",(g.startsWith("日本")?"🗾 ":"🌏 ")+g));
    const grid = el("div","stage-grid");
    DEEP_STAGES.filter(s=>s.group===g).forEach(st=>{
      const rec = STATE.drill[st.id]||{};
      const b = el("button","stage-card"+(rec.cleared?" cleared":""));
      b.innerHTML = `<div class="sc-emoji">${st.emoji}</div>
        <div class="sc-title">${st.title}</div>
        <div class="sc-sub">${st.sub}</div>
        ${rec.cleared?`<div class="sc-badge">★ ${rec.best}/${QPER}</div>`:""}`;
      b.onclick = ()=>startQuiz("drill", st);
      grid.appendChild(b);
    });
    root.appendChild(grid);
  });

  app().innerHTML=""; app().appendChild(root);
}

function renderWorldMap(){
  const wrap = el("div","worldmap");
  // クリア済みの国を訪問順（WORLD_STAGES順）でルート結線
  const visited = WORLD_STAGES.filter(s=>STATE.world[s.id]&&STATE.world[s.id].cleared)
                              .map(s=>COUNTRIES.find(c=>c.id===s.countryId));
  const tokyo = merc(139.7, 35.7);
  let pts = [tokyo, ...visited.map(lonlat)];
  let line = "";
  for(let i=1;i<pts.length;i++){
    line += `<line x1="${pts[i-1].x}" y1="${pts[i-1].y}" x2="${pts[i].x}" y2="${pts[i].y}" class="route"/>`;
  }
  let dots = COUNTRIES.map(c=>{
    const p=lonlat(c);
    const done = visited.some(v=>v.id===c.id);
    return `<circle cx="${p.x}" cy="${p.y}" r="${done?3.2:2.2}" class="${done?'dot done':'dot'}"/>`;
  }).join("");
  // 出発地・東京
  dots += `<circle cx="${tokyo.x}" cy="${tokyo.y}" r="3" class="dot home"/>`;

  // 伶奈ちゃんを乗せた飛行機が地図の上を旅して回る
  let motionPath;
  if(visited.length>=1){
    motionPath = "M" + pts.map(p=>`${p.x} ${p.y}`).join(" L ") + ` L ${tokyo.x} ${tokyo.y}`;
  }else{
    // まだ国がないときは東京の上をくるくる
    const r=8;
    motionPath = `M ${tokyo.x-r} ${tokyo.y} a ${r} ${r} 0 1 0 ${2*r} 0 a ${r} ${r} 0 1 0 ${-2*r} 0`;
  }
  const dur = Math.max(10, (visited.length+1)*4);
  // 窓の中身（写真 or デフォルトの女の子）。窓の中心は (0,-0.5)
  const face = STATE.photo
    ? `<image href="${STATE.photo}" x="-5.3" y="-5.8" width="10.6" height="10.6" clip-path="url(#faceClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<g>
        <circle cx="0" cy="-0.5" r="4.4" fill="#ffe0bd"/>
        <path d="M-4.4 -0.6 A4.4 4.4 0 0 1 4.4 -0.6 L3.2 -1.8 A3.4 3.4 0 0 0 -3.2 -1.8 Z" fill="#6b4423"/>
        <circle cx="-1.6" cy="-0.4" r="0.7" fill="#3a2a20"/>
        <circle cx="1.6" cy="-0.4" r="0.7" fill="#3a2a20"/>
        <circle cx="-1.35" cy="-0.65" r="0.22" fill="#fff"/>
        <circle cx="1.85" cy="-0.65" r="0.22" fill="#fff"/>
        <circle cx="-2.7" cy="0.9" r="0.85" fill="#ffb3c6" opacity="0.85"/>
        <circle cx="2.7" cy="0.9" r="0.85" fill="#ffb3c6" opacity="0.85"/>
        <path d="M-1.3 1 Q0 2 1.3 1" fill="none" stroke="#c0392b" stroke-width="0.55" stroke-linecap="round"/>
      </g>`;
  // 本物の旅客機（横向き・機首は右）。中央の丸窓に顔
  const planeInner = `
    <path d="M-22 1 q-13 1 -26 -4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.6 4.5" opacity="0.85"/>
    <path d="M-20 -3 q-11 0 -22 -5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="0.6 4.5" opacity="0.55"/>
    <path d="M4 -4 L-8 -11 L-1 -4 Z" fill="#aebccf" stroke="#8a9bb0" stroke-width="0.5"/>
    <path d="M-15 -4.5 L-24 -15 L-12 -4.5 Z" fill="#ff5d8f" stroke="#e63e72" stroke-width="0.6"/>
    <path d="M-16 3 L-24 6.5 L-13.5 5 Z" fill="#ff8fb0" stroke="#e63e72" stroke-width="0.5"/>
    <path d="M23 0 C17 -6 7 -6.5 -5 -6.2 L-17 -5.2 C-21 -4.8 -22 -2.2 -22 0 C-22 2.2 -21 4.8 -17 5.2 L-5 6.2 C7 6.5 17 6 23 0 Z" fill="#f4f8fc" stroke="#b3c2d4" stroke-width="0.8"/>
    <rect x="-17" y="1.6" width="38" height="1.7" rx="0.8" fill="#ff5d8f" opacity="0.85"/>
    <path d="M4 5 L-12 14 L-3 14 L10 5 Z" fill="#c4d2e3" stroke="#9aabc0" stroke-width="0.6"/>
    <ellipse cx="-1.5" cy="11.2" rx="3.6" ry="1.9" fill="#9fb2c8" stroke="#7d90a8" stroke-width="0.5"/>
    <path d="M19.5 -1.2 L15 -3.6 L14 -1 Z" fill="#bfe0f5" stroke="#7fb8d8" stroke-width="0.4"/>
    <circle cx="-13" cy="-2.6" r="0.95" fill="#bfe0f5" stroke="#7fb8d8" stroke-width="0.35"/>
    <circle cx="-10.3" cy="-2.6" r="0.95" fill="#bfe0f5" stroke="#7fb8d8" stroke-width="0.35"/>
    <circle cx="9.3" cy="-2.6" r="0.95" fill="#bfe0f5" stroke="#7fb8d8" stroke-width="0.35"/>
    <circle cx="12" cy="-2.6" r="0.95" fill="#bfe0f5" stroke="#7fb8d8" stroke-width="0.35"/>
    <circle cx="0" cy="-0.5" r="6" fill="#eaf6ff" stroke="#ff5d8f" stroke-width="1.2"/>
    ${face}`;
  const plane = `
    <g class="plane">
      <g transform="scale(1.15)">${planeInner}</g>
      <animateMotion dur="${dur}s" repeatCount="indefinite" rotate="0" path="${motionPath}"/>
    </g>`;

  wrap.innerHTML = `<svg viewBox="0 0 360 252" preserveAspectRatio="xMidYMid meet">
    <defs><clipPath id="faceClip"><circle cx="0" cy="-0.5" r="5.3"/></clipPath></defs>
    <rect x="0" y="0" width="360" height="252" class="ocean"/>
    <g class="land">${WORLD_LAND_PATHS.map(d=>`<path d="${d}"/>`).join("")}</g>
    ${line}
    ${dots}
    ${plane}
  </svg>
  <div class="map-cap">✈️ 伶奈ちゃん世界一周中！　訪れた国 ${visited.length} / ${COUNTRIES.length}</div>`;

  // 顔写真の設定ボタン
  const ctrl = el("div","photo-ctrl");
  const fileInput = el("input"); fileInput.type="file"; fileInput.accept="image/*"; fileInput.style.display="none";
  const setBtn = el("button","photo-btn", STATE.photo? "📷 顔写真を変える" : "📷 飛行機に顔写真をのせる");
  setBtn.onclick = ()=> fileInput.click();
  fileInput.onchange = ()=>{
    const f = fileInput.files && fileInput.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      resizePhoto(reader.result, 160, (data)=>{
        STATE.photo = data; save(STATE);
        renderStageSelect("world");
      });
    };
    reader.readAsDataURL(f);
  };
  ctrl.appendChild(setBtn);
  ctrl.appendChild(fileInput);
  if(STATE.photo){
    const del = el("button","photo-btn ghost","写真をけす");
    del.onclick = ()=>{ delete STATE.photo; save(STATE); renderStageSelect("world"); };
    ctrl.appendChild(del);
  }
  wrap.appendChild(ctrl);
  return wrap;
}

// 写真を小さくリサイズしてlocalStorageに収める（正方形に切り抜き）
function resizePhoto(dataUrl, size, cb){
  const img = new Image();
  img.onload = ()=>{
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const s = Math.min(img.width, img.height);
    const sx = (img.width - s)/2, sy = (img.height - s)/2;
    ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
    cb(c.toDataURL("image/jpeg", 0.82));
  };
  img.onerror = ()=> cb(dataUrl);
  img.src = dataUrl;
}

// ---------- クイズ ----------
let QUIZ = null;
let TIMER = null;
function stopTimer(){ if(TIMER){ clearInterval(TIMER); TIMER=null; } }
function fmtTime(sec){ return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"); }

function startQuiz(mode, stage){
  stopTimer();
  let qs;
  if(mode==="japan") qs = buildJapanQuestions(stage);
  else if(mode==="world") qs = buildWorldQuestions(stage);
  else if(mode==="drill") qs = buildDrillQuestions(stage);
  else if(mode==="review") qs = buildReviewQuestions();
  else qs = buildTestQuestions();
  if(!qs.length){ renderHome(); return; }
  QUIZ = { mode, stage, qs, idx:0, correct:0 };
  if(mode==="test"){
    QUIZ.deadline = Date.now() + TEST_TIME*1000;
    TIMER = setInterval(()=>{
      if(!QUIZ) { stopTimer(); return; }
      const left = Math.max(0, Math.ceil((QUIZ.deadline-Date.now())/1000));
      const t = document.getElementById("qtimer");
      if(t){ t.textContent = "⏱ "+fmtTime(left); if(left<=60) t.classList.add("hurry"); }
      if(left<=0){ stopTimer(); QUIZ.timeup = true; renderResult(); }
    }, 250);
  }
  renderQuestion();
}

function renderQuestion(){
  const {qs, idx, correct} = QUIZ;
  const q = qs[idx];
  const root = el("div","screen quiz");
  // ヘッダー
  const head = el("div","quiz-head");
  head.appendChild(el("div","q-stage", `${QUIZ.stage.emoji} ${QUIZ.stage.title}`));
  head.appendChild(el("div","q-count",
    (QUIZ.mode==="test"?`<span id="qtimer" class="q-timer">⏱ --:--</span>　`:"")
    + `${idx+1} / ${qs.length}　⭕${correct}`));
  root.appendChild(head);
  // 進捗バー
  const bar = el("div","qbar"); bar.appendChild(el("div","qbar-fill"));
  bar.firstChild.style.width = (idx/qs.length*100)+"%";
  root.appendChild(bar);

  root.appendChild(el("div","q-text", q.q));

  if(q.type==="choice"){
    const opts = el("div","options");
    q.options.forEach((o,i)=>{
      const b = el("button","opt", o);
      b.onclick = ()=>answerChoice(b, i, q, opts);
      opts.appendChild(b);
    });
    root.appendChild(opts);
  } else if(q.type==="order"){
    root.appendChild(renderOrder(q));
  } else if(q.type==="input"){
    root.appendChild(renderInput(q, root));
  }
  app().innerHTML=""; app().appendChild(root);
  if(q.type==="input"){
    const inp = root.querySelector(".kaki-input");
    if(inp) setTimeout(()=>inp.focus(), 150);
  }
}

// 答えたあとの解説＋「つぎへ」ボタン
function showFeedback(ok, q){
  const root = document.querySelector(".screen.quiz");
  if(!root) return;
  const box = el("div","exp-box "+(ok?"good":"bad"));
  let html = `<div class="exp-head">${ok?"⭕ せいかい！":"❌ ざんねん…"}</div>`;
  if(!ok){
    const ans = q.type==="choice"? q.options[q.answer] : (q.type==="input"? q.ans : null);
    if(ans) html += `<div class="exp-ans">正解：${ans}</div>`;
  }
  if(q.exp) html += `<div class="exp-text">💡 ${q.exp}</div>`;
  box.innerHTML = html;
  const next = el("button","next-btn", QUIZ.idx+1>=QUIZ.qs.length ? "けっかを見る →" : "つぎへ →");
  next.onclick = nextQuestion;
  box.appendChild(next);
  root.appendChild(box);
  box.scrollIntoView({behavior:"smooth", block:"end"});
}

function answerChoice(btn, picked, q, container){
  if(container.dataset.done) return;
  container.dataset.done="1";
  const btns = [...container.children];
  btns.forEach(b=>b.disabled=true);
  const ok = picked===q.answer;
  if(ok){
    btn.classList.add("correct");
    QUIZ.correct++;
    play("ok");
    clearMistake(q);
  }else{
    btn.classList.add("wrong");
    btns[q.answer].classList.add("correct");
    play("ng");
    recordMistake(q);
  }
  showFeedback(ok, q);
}

// 書き取り（入力式）問題
function renderInput(q){
  const wrap = el("div","kaki-wrap");
  const inp = document.createElement("input");
  inp.className = "kaki-input";
  inp.type = "text";
  inp.placeholder = "ここに答えを書こう";
  inp.autocomplete = "off";
  const ok = el("button","order-submit","こたえる！");
  const check = ()=>{
    if(ok.disabled) return;
    const v = normalizeAns(inp.value);
    if(!v){ inp.focus(); return; }
    ok.disabled = true; inp.disabled = true;
    const good = q.accept.some(a=>normalizeAns(a)===v);
    if(good){ QUIZ.correct++; play("ok"); inp.classList.add("good"); clearMistake(q); }
    else { play("ng"); inp.classList.add("bad"); recordMistake(q); }
    showFeedback(good, q);
  };
  ok.onclick = check;
  inp.addEventListener("keydown", e=>{ if(e.key==="Enter") check(); });
  wrap.appendChild(inp);
  wrap.appendChild(ok);
  return wrap;
}

function renderOrder(q){
  // 上から正しい順に並べる。シャッフルした順で表示し、↑↓で入れ替え。
  const wrap = el("div","order-wrap");
  let order = shuffle(q.items);
  const list = el("div","order-list");
  function draw(){
    list.innerHTML="";
    order.forEach((it,i)=>{
      const row = el("div","order-row");
      row.appendChild(el("span","order-num", "北"+(i===0?" ↑":"")));
      row.appendChild(el("span","order-label", it.label));
      const ctr = el("span","order-ctrl");
      const up = el("button","oc","▲"); up.disabled=(i===0);
      const dn = el("button","oc","▼"); dn.disabled=(i===order.length-1);
      up.onclick=()=>{ [order[i-1],order[i]]=[order[i],order[i-1]]; draw(); };
      dn.onclick=()=>{ [order[i+1],order[i]]=[order[i],order[i+1]]; draw(); };
      ctr.appendChild(up); ctr.appendChild(dn);
      row.appendChild(ctr);
      list.appendChild(row);
    });
  }
  draw();
  wrap.appendChild(list);
  const ok = el("button","order-submit","これで決定！");
  ok.onclick = ()=>{
    ok.disabled=true;
    const correct = order.every((it,i,arr)=> i===0 || arr[i-1].value <= it.value);
    if(correct){ QUIZ.correct++; play("ok"); ok.textContent="せいかい！⭕"; ok.classList.add("correct"); clearMistake(q); }
    else { play("ng"); ok.textContent="ざんねん…正しい順を表示中"; ok.classList.add("wrong"); recordMistake(q);
      // 正解順を表示
      order = q.items.slice().sort((a,b)=>a.value-b.value); draw();
      [...list.querySelectorAll(".oc")].forEach(b=>b.disabled=true);
    }
    showFeedback(correct, q);
  };
  wrap.appendChild(ok);
  return wrap;
}

function nextQuestion(){
  QUIZ.idx++;
  if(QUIZ.idx>=QUIZ.qs.length) renderResult();
  else renderQuestion();
}

// ---------- 結果 ----------
function renderResult(){
  stopTimer();
  const {mode, stage, correct, qs} = QUIZ;
  bumpStreak();

  // にがて復習・テストは専用の結果画面
  if(mode==="review"){ save(STATE); renderReviewResult(); return; }
  if(mode==="test"){ renderTestResult(); return; }

  const passed = correct>=PASS;
  const store = mode==="japan"? STATE.japan : mode==="world"? STATE.world : STATE.drill;
  const prev = store[stage.id]||{cleared:false,best:0};
  store[stage.id] = { cleared: prev.cleared||passed, best: Math.max(prev.best, correct) };

  // おみやげ獲得（クリア時）
  let newStamp = null;
  if(passed){
    if(mode==="world"){
      const c = COUNTRIES.find(x=>x.id===stage.countryId);
      if(!STATE.stamps[c.id]){ STATE.stamps[c.id]={name:c.name, flag:c.flag, kind:"world"}; newStamp=`${c.flag} ${c.name}`; }
    }else if(mode==="drill"){
      if(!STATE.stamps[stage.id]){ STATE.stamps[stage.id]={name:stage.title, flag:stage.emoji, kind:"drill"}; newStamp=`${stage.emoji} ${stage.title}`; }
    }else{
      if(!STATE.stamps[stage.id]){ STATE.stamps[stage.id]={name:stage.title, flag:stage.emoji, kind:"japan"}; newStamp=`${stage.emoji} ${stage.title}`; }
    }
  }
  const justUnlocked = mode==="japan" && !STATE.worldUnlocked && isJapanAllCleared();
  if(justUnlocked) STATE.worldUnlocked=true;
  save(STATE);

  setBG(mode);
  const root = el("div","screen result");
  root.appendChild(el("div","res-emoji", passed?"🎉":"💪"));
  root.appendChild(el("h2",null, passed?"クリア！":"もう少し！"));
  root.appendChild(el("div","res-score", `${correct} / ${qs.length} 問せいかい`));
  root.appendChild(el("div","res-msg", passed
    ? "合格ライン（7問）クリア！おみやげをゲット！"
    : `クリアまであと ${Math.max(0,PASS-correct)} 問。もう一度ちょうせん！`));
  if(newStamp) root.appendChild(el("div","res-stamp", `🎁 おみやげ獲得：${newStamp}`));
  if(justUnlocked) root.appendChild(el("div","res-unlock", "✈️ 日本制覇！『海外編 世界一周』がひらいたよ！"));
  const nMistakes = mistakeCount();
  if(!passed && nMistakes) root.appendChild(el("div","res-msg",`🔁 間違えた問題は「にがて復習」（${nMistakes}問）にたまっているよ`));

  const btns = el("div","res-btns");
  const retry = el("button","btn","もう一度"); retry.onclick=()=>startQuiz(mode,stage);
  const list = el("button","btn ghost","ステージ選択へ");
  list.onclick = mode==="drill"? renderDrillSelect : ()=>renderStageSelect(mode);
  const home = el("button","btn ghost","ホーム"); home.onclick=renderHome;
  btns.appendChild(retry); btns.appendChild(list); btns.appendChild(home);
  root.appendChild(btns);
  if(passed) confetti(root);
  app().innerHTML=""; app().appendChild(root);
}

function renderReviewResult(){
  const {correct, qs} = QUIZ;
  const remain = mistakeCount();
  setBG("");
  const root = el("div","screen result");
  const allGone = remain===0;
  root.appendChild(el("div","res-emoji", allGone?"🌟":"🔁"));
  root.appendChild(el("h2",null, allGone?"にがて全クリア！":"復習おつかれさま！"));
  root.appendChild(el("div","res-score", `${correct} / ${qs.length} 問せいかい`));
  root.appendChild(el("div","res-msg", allGone
    ? "にがてが全部なくなったよ！すごい！"
    : `のこりのにがては ${remain} 問。くり返せば必ずへるよ！`));

  const btns = el("div","res-btns");
  if(!allGone){
    const retry = el("button","btn","つづけて復習");
    retry.onclick=()=>startQuiz("review", QUIZ.stage);
    btns.appendChild(retry);
  }
  const home = el("button","btn ghost","ホーム"); home.onclick=renderHome;
  btns.appendChild(home);
  root.appendChild(btns);
  if(allGone) confetti(root);
  app().innerHTML=""; app().appendChild(root);
}

function renderTestResult(){
  const {correct, qs, timeup} = QUIZ;
  const pct = correct/qs.length;
  const rank = pct>=0.9? {r:"S", e:"🏆", m:"パーフェクトにあと一歩！天才！"}
             : pct>=0.75? {r:"A", e:"🥇", m:"すばらしい！テスト本番もばっちり！"}
             : pct>=0.5?  {r:"B", e:"🥈", m:"いい調子！にがて復習でAを目指そう！"}
             :            {r:"C", e:"💪", m:"まだまだこれから！ドリルで力をつけよう！"};
  const isBest = STATE.testBest==null || correct>STATE.testBest;
  if(isBest) STATE.testBest = correct;
  save(STATE);

  setBG("");
  const root = el("div","screen result");
  root.appendChild(el("div","res-emoji", rank.e));
  root.appendChild(el("h2",null, timeup? "時間切れ！" : "テスト終了！"));
  root.appendChild(el("div","res-rank", `ランク ${rank.r}`));
  root.appendChild(el("div","res-score", `${correct} / ${qs.length} 問せいかい`));
  root.appendChild(el("div","res-msg", rank.m));
  if(isBest) root.appendChild(el("div","res-stamp","✨ さいこう記録こうしん！"));
  const remain = mistakeCount();
  if(remain) root.appendChild(el("div","res-msg",`🔁 間違えた問題は「にがて復習」（${remain}問）で復習できるよ`));

  const btns = el("div","res-btns");
  const retry = el("button","btn","もう一度テスト"); retry.onclick=()=>startQuiz("test", QUIZ.stage);
  const home = el("button","btn ghost","ホーム"); home.onclick=renderHome;
  btns.appendChild(retry); btns.appendChild(home);
  root.appendChild(btns);
  if(pct>=0.75) confetti(root);
  app().innerHTML=""; app().appendChild(root);
}

// ---------- コレクション ----------
function renderCollection(){
  stopTimer();
  setBG("");
  const root = el("div","screen collection");
  const head = el("div","select-head");
  const back = el("button","back","← もどる"); back.onclick=renderHome;
  head.appendChild(back); head.appendChild(el("h2",null,"🎒 おみやげコレクション"));
  root.appendChild(head);

  const jpStamps = Object.values(STATE.stamps).filter(s=>s.kind==="japan");
  const dStamps  = Object.values(STATE.stamps).filter(s=>s.kind==="drill");
  const wStamps  = Object.values(STATE.stamps).filter(s=>s.kind==="world");

  root.appendChild(el("h3","col-h","🗾 日本のスタンプ ("+jpStamps.length+"/"+JAPAN_STAGES.length+")"));
  const g1 = el("div","stamp-grid");
  JAPAN_STAGES.forEach(s=>{
    const got = STATE.stamps[s.id];
    const c = el("div","stamp"+(got?"":" empty"));
    c.innerHTML = got? `<div class="st-emoji">${s.emoji}</div><div class="st-name">${s.title}</div>` : `<div class="st-emoji">？</div>`;
    g1.appendChild(c);
  });
  root.appendChild(g1);

  root.appendChild(el("h3","col-h","⛰️ 深掘りメダル ("+dStamps.length+"/"+DEEP_STAGES.length+")"));
  const g3 = el("div","stamp-grid");
  DEEP_STAGES.forEach(s=>{
    const got = STATE.stamps[s.id];
    const c = el("div","stamp"+(got?"":" empty"));
    c.innerHTML = got? `<div class="st-emoji">${s.emoji}</div><div class="st-name">${s.title}</div>` : `<div class="st-emoji">？</div>`;
    g3.appendChild(c);
  });
  root.appendChild(g3);

  root.appendChild(el("h3","col-h","🌏 世界のおみやげ ("+wStamps.length+"/"+COUNTRIES.length+")"));
  const g2 = el("div","stamp-grid");
  COUNTRIES.forEach(c=>{
    const got = STATE.stamps[c.id];
    const card = el("div","stamp"+(got?"":" empty"));
    card.innerHTML = got? `<div class="st-emoji">${c.flag}</div><div class="st-name">${c.name}</div>` : `<div class="st-emoji">？</div>`;
    g2.appendChild(card);
  });
  root.appendChild(g2);

  app().innerHTML=""; app().appendChild(root);
}

// ---------- 効果音・演出 ----------
let actx=null;
function play(type){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(), g=actx.createGain();
    o.connect(g); g.connect(actx.destination);
    if(type==="ok"){ o.frequency.value=880; o.frequency.setValueAtTime(660,actx.currentTime); o.frequency.setValueAtTime(990,actx.currentTime+0.1);}
    else { o.frequency.value=200; }
    g.gain.value=0.08; o.start(); o.stop(actx.currentTime+0.18);
  }catch(e){}
}
function confetti(root){
  const wrap=el("div","confetti");
  const colors=["#ff5d8f","#ffd23f","#3bceac","#5d9cec","#a06cd5"];
  for(let i=0;i<40;i++){
    const p=el("i");
    p.style.left=Math.random()*100+"%";
    p.style.background=colors[i%colors.length];
    p.style.animationDelay=(Math.random()*0.6)+"s";
    p.style.transform=`rotate(${Math.random()*360}deg)`;
    wrap.appendChild(p);
  }
  root.appendChild(wrap);
}

// ---------- 起動 ----------
renderHome();
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

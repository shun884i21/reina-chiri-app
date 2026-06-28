// レイナのチリ勉強アプリ - ロジック
"use strict";

const PASS = 7;          // 10問中7問でクリア
const QPER = 10;         // 1ステージの問題数
const SAVE_KEY = "reina-chiri-save-v1";

const REGION_LIST = ["北海道","東北","関東","中部","近畿","中国・四国","九州・沖縄"];

// ---------- セーブデータ ----------
function defaultSave(){
  return { japan:{}, world:{}, stamps:{}, worldUnlocked:false };
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

// ---------- ユーティリティ ----------
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function sample(a,n){ return shuffle(a).slice(0,n); }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

// 4択を作る：正解＋誤答プール3つ
function makeChoice(q, answer, pool){
  const distract = sample(pool.filter(x=>x!==answer), 3);
  const options = shuffle([answer, ...distract]);
  return { type:"choice", q, options, answer: options.indexOf(answer) };
}

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
    pool.push(makeChoice(`${p.name}の県庁所在地は？`, p.capital, allCaps));
    pool.push(makeChoice(`県庁所在地が「${p.capital}」なのは？`, p.name, allNames));
    pool.push(makeChoice(`${p.name}の名産は？`, p.meibutsu, allMeib));
    pool.push(makeChoice(`${p.name}は何地方？`, p.region, REGION_LIST));
  });

  // 地形・気候クイズ（このステージの県/地方に関係するもの）
  GEO_QUIZ.forEach(g=>{
    const ans = g.a;
    const relevant = prefs.some(p=>p.name===ans) || stage.regions.includes(ans);
    if(relevant){
      const options = shuffle([g.a, ...g.choices]);
      pool.push({ type:"choice", q:g.q, options, answer:options.indexOf(g.a) });
    }
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
      makeChoice(`${c.name}の首都は？`, c.capital, allCaps),
      makeChoice(`首都が「${c.capital}」の国は？`, c.name, allNames),
      makeChoice(`${c.name}は何大陸（地域）にある？`, c.continent, continents),
      makeChoice(`${c.name}の特ちょうに合うのは？`, c.feature, allFeat),
      { type:"choice", q:`${c.name}の国旗は？`,
        options: shuffle([c.flag, ...sample(allFlags.filter(f=>f!==c.flag),3)]),
        answer: -1 },
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

// ---------- 画面表示 ----------
const app = () => document.getElementById("app");

function setBG(mode){
  document.body.className = mode; // "japan" / "world" / ""
}

// 経度緯度 → 地図SVG座標（viewBox 0 0 360 180, 経度+180, 90-緯度）
function lonlat(c){ return { x: c.lon+180, y: 90-c.lat }; }

function renderHome(){
  setBG("");
  const unlocked = STATE.worldUnlocked || isJapanAllCleared();
  if(unlocked) STATE.worldUnlocked = true, save(STATE);
  const jpDone = JAPAN_STAGES.filter(s=>STATE.japan[s.id]&&STATE.japan[s.id].cleared).length;
  const wDone = WORLD_STAGES.filter(s=>STATE.world[s.id]&&STATE.world[s.id].cleared).length;
  const stampCount = Object.keys(STATE.stamps).length;

  const root = el("div","screen home");
  root.appendChild(el("div","logo","🌏 伶奈の地理勉強アプリ"));
  root.appendChild(el("p","tagline","日本を旅して、世界一周にでかけよう！"));

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

function renderWorldMap(){
  const wrap = el("div","worldmap");
  // クリア済みの国を訪問順（WORLD_STAGES順）でルート結線
  const visited = WORLD_STAGES.filter(s=>STATE.world[s.id]&&STATE.world[s.id].cleared)
                              .map(s=>COUNTRIES.find(c=>c.id===s.countryId));
  const tokyo = {x:139+180, y:90-36};
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
  const face = STATE.photo
    ? `<image href="${STATE.photo}" x="-7.2" y="-11.2" width="14.4" height="14.4" clip-path="url(#faceClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<text x="0" y="-0.5" text-anchor="middle" font-size="9">👧</text>`;
  const plane = `
    <g class="plane">
      <text x="0" y="7" text-anchor="middle" font-size="19">✈️</text>
      <circle cx="0" cy="-4" r="8" fill="#fff" stroke="#ff5d8f" stroke-width="1.3"/>
      ${face}
      <animateMotion dur="${dur}s" repeatCount="indefinite" rotate="0" path="${motionPath}"/>
    </g>`;

  wrap.innerHTML = `<svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet">
    <defs><clipPath id="faceClip"><circle cx="0" cy="-4" r="7.2"/></clipPath></defs>
    <rect x="0" y="0" width="360" height="180" class="ocean"/>
    ${WORLD_CONTINENTS}
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
function startQuiz(mode, stage){
  const qs = mode==="japan"? buildJapanQuestions(stage) : buildWorldQuestions(stage);
  QUIZ = { mode, stage, qs, idx:0, correct:0 };
  renderQuestion();
}

function renderQuestion(){
  const {qs, idx, correct} = QUIZ;
  const q = qs[idx];
  const root = el("div","screen quiz");
  // ヘッダー
  const head = el("div","quiz-head");
  head.appendChild(el("div","q-stage", `${QUIZ.stage.emoji} ${QUIZ.stage.title}`));
  head.appendChild(el("div","q-count", `${idx+1} / ${qs.length}　⭕${correct}`));
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
      b.onclick = ()=>answerChoice(b, i, q.answer, opts);
      opts.appendChild(b);
    });
    root.appendChild(opts);
  } else if(q.type==="order"){
    root.appendChild(renderOrder(q));
  }
  app().innerHTML=""; app().appendChild(root);
}

function answerChoice(btn, picked, answer, container){
  if(container.dataset.done) return;
  container.dataset.done="1";
  const btns = [...container.children];
  btns.forEach(b=>b.disabled=true);
  if(picked===answer){
    btn.classList.add("correct");
    QUIZ.correct++;
    play("ok");
  }else{
    btn.classList.add("wrong");
    btns[answer].classList.add("correct");
    play("ng");
  }
  setTimeout(nextQuestion, 850);
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
    if(correct){ QUIZ.correct++; play("ok"); ok.textContent="せいかい！⭕"; ok.classList.add("correct"); }
    else { play("ng"); ok.textContent="ざんねん…正しい順を表示中"; ok.classList.add("wrong");
      // 正解順を表示
      order = q.items.slice().sort((a,b)=>a.value-b.value); draw();
      [...list.querySelectorAll(".oc")].forEach(b=>b.disabled=true);
    }
    setTimeout(nextQuestion, 1300);
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
  const {mode, stage, correct, qs} = QUIZ;
  const passed = correct>=PASS;
  const store = mode==="japan"? STATE.japan : STATE.world;
  const prev = store[stage.id]||{cleared:false,best:0};
  store[stage.id] = { cleared: prev.cleared||passed, best: Math.max(prev.best, correct) };

  // おみやげ獲得（クリア時）
  let newStamp = null;
  if(passed){
    if(mode==="world"){
      const c = COUNTRIES.find(x=>x.id===stage.countryId);
      if(!STATE.stamps[c.id]){ STATE.stamps[c.id]={name:c.name, flag:c.flag, kind:"world"}; newStamp=`${c.flag} ${c.name}`; }
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

  const btns = el("div","res-btns");
  const retry = el("button","btn","もう一度"); retry.onclick=()=>startQuiz(mode,stage);
  const list = el("button","btn ghost","ステージ選択へ"); list.onclick=()=>renderStageSelect(mode);
  const home = el("button","btn ghost","ホーム"); home.onclick=renderHome;
  btns.appendChild(retry); btns.appendChild(list); btns.appendChild(home);
  root.appendChild(btns);
  if(passed) confetti(root);
  app().innerHTML=""; app().appendChild(root);
}

// ---------- コレクション ----------
function renderCollection(){
  setBG("");
  const root = el("div","screen collection");
  const head = el("div","select-head");
  const back = el("button","back","← もどる"); back.onclick=renderHome;
  head.appendChild(back); head.appendChild(el("h2",null,"🎒 おみやげコレクション"));
  root.appendChild(head);

  const jpStamps = Object.values(STATE.stamps).filter(s=>s.kind==="japan");
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

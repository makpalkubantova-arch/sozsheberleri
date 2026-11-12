/* «Маленькие изобретатели» — доска (по умолчанию), телефон ученика (?m=s), страница проекта для гостей (?p=N). */
(() => {
const D = window.DATA, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = new URLSearchParams(location.search), MODE = Q.get("p") != null ? "visit" : (Q.get("m") === "s" ? "stu" : "board");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = { get(k, d) { try { const v = localStorage.getItem("stem_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("stem_" + k, JSON.stringify(v)); } catch {} } };
const SITE = location.href.split(/[?#]/)[0];
const ST = Object.fromEntries(D.stations.map(s => [s.id, s]));
document.body.dataset.mode = MODE;

/* ---------- облако (Firebase REST, без SDK) ---------- */
const CL = (() => {
  const url = (Q.get("db") || LS.get("db", "") || D.live.url || "").replace(/\/+$/, ""), room = D.live.room + (Q.get("t") ? "-" + Q.get("t").replace(/[^\w-]/g, "") : "");
  const ok = /^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(url);
  const r = async (p, m = "GET", b) => { if (!ok) throw 0; const x = await fetch(`${url}/${room}/${p}.json`, { method: m, headers: { "Content-Type": "application/json" }, body: b == null ? undefined : JSON.stringify(b) }); if (!x.ok) throw 0; return x.json(); };
  return { ok, get: p => r(p), put: (p, v) => r(p, "PUT", v), post: (p, v) => r(p, "POST", v), del: p => r(p, "DELETE") };
})();
let CLOUD = { stars: {}, bridge: {}, votes: {}, proj: {}, reflect: {} };
async function pull() { try { const d = await CL.get(""); CLOUD = Object.assign({ stars: {}, bridge: {}, votes: {}, proj: {}, reflect: {} }, d || {}); refreshLive(); } catch {} }
/* QR с дизайном: цветные круглые точки, скруглённые «глазки», градиент и значок в центре */
let QRN = 0;
const qrSvg = (text, o = {}) => { if (typeof o === "string") o = { c1: o };
  const c1 = o.c1 || "#FF8C42", c2 = o.c2 || "#8E44D9", eye = o.eye || "#14213D", logo = o.logo || "💡";
  const q = qrcode(0, "H"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 3, S = n + m * 2, id = "qg" + (++QRN);
  const inF = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  const L = Math.ceil(n * .22), lo = Math.floor((n - L) / 2), inL = (x, y) => x >= lo && x < lo + L && y >= lo && y < lo + L;
  let d = ""; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x) && !inF(x, y) && !inL(x, y)) d += `<circle cx="${x + m + .5}" cy="${y + m + .5}" r=".47"/>`;
  const eyeAt = (x, y) => `<rect x="${x + m + .5}" y="${y + m + .5}" width="6" height="6" rx="2" fill="none" stroke="${eye}" stroke-width="1"/><rect x="${x + m + 2}" y="${y + m + 2}" width="3" height="3" rx="1" fill="url(#${id})"/>`;
  const cx = m + n / 2, r = L / 2 + .2;
  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${S}" height="${S}" rx="${m}" fill="#fff"/><g fill="url(#${id})">${d}</g>${eyeAt(0, 0)}${eyeAt(n - 7, 0)}${eyeAt(0, n - 7)}
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="#fff" stroke="url(#${id})" stroke-width=".6"/><text x="${cx}" y="${cx}" font-size="${L * .62}" text-anchor="middle" dominant-baseline="central">${logo}</text></svg>`; };
const extra = () => (Q.get("t") ? "&t=" + encodeURIComponent(Q.get("t")) : "");
const stuUrl = () => SITE + "?m=s" + extra(), projUrl = t => SITE + "?p=" + t + extra();

/* ---------- звёзды команд ---------- */
const starsOf = t => { const s = (CLOUD.stars || {})[t] || LS.get("stars", {})[t] || {}; return Object.values(s).reduce((a, v) => a + (+v || 0), 0); };
function setStar(t, sid, n) { const all = LS.get("stars", {}); (all[t] = all[t] || {})[sid] = n; LS.set("stars", all);
  CLOUD.stars = CLOUD.stars || {}; (CLOUD.stars[t] = CLOUD.stars[t] || {})[sid] = n; CL.put(`stars/${t}/${sid}`, n).catch(() => {}); refreshLive(); }
const getStar = (t, sid) => (((CLOUD.stars || {})[t] || LS.get("stars", {})[t] || {})[sid]) || 0;

/* ---------- таймер ---------- */
const TM = { left: 7 * 60, run: false, end: 0, total: 7 * 60 };
function tmDraw() { const l = Math.max(0, TM.run ? Math.round((TM.end - Date.now()) / 1000) : TM.left);
  const el = $("#tmT"); if (el) { el.textContent = `${String(Math.floor(l / 60)).padStart(2, "0")}:${String(l % 60).padStart(2, "0")}`; el.parentElement.classList.toggle("warn", TM.run && l <= 30); }
  const b = $("#tmGo"); if (b) b.textContent = TM.run ? "⏸" : "▶";
  if (TM.run && l <= 0) { TM.run = false; TM.left = 0; beep(3); $("#tmOver").hidden = false; } }
setInterval(tmDraw, 250);
let AC; const ac = () => (AC = AC || new (window.AudioContext || window.webkitAudioContext)());
function tone(f, d = 1.5, type = "triangle", vol = .25) { const c = ac(), o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d); }
function beep(n = 1) { for (let i = 0; i < n; i++) setTimeout(() => tone(880, .35, "square", .15), i * 450); }

/* ---------- каркас ---------- */
const app = $("#app");
function topbar() {
  const team = LS.get("team", null);
  return `<header class="top">
    <a class="brand" href="#home"><span class="logo">💡</span><span><b>${esc(D.title)}</b><small>${esc(D.sub)}</small></span></a>
    ${MODE === "board" ? `<nav class="tnav"><a href="#home">🏠 Станции</a><a href="#teacher">👩‍🏫 Учителю</a></nav>
    <div class="timer"><button class="tp" data-t="60">1</button><button class="tp" data-t="180">3</button><button class="tp" data-t="420">7</button><button class="tp" data-t="600">10</button>
      <b id="tmT">07:00</b><button id="tmGo" class="tg">▶</button><button id="tmRe" class="tg">↺</button></div>
    <button class="qrb" id="qrBtn" title="QR для учеников">📱 QR</button><button class="qrb" id="fsBtn" title="Во весь экран">⛶</button>`
    : MODE === "stu" ? `<button class="myteam" id="myTeam">${team != null ? D.teams[team].i + " " + esc(D.teams[team].n) : "Выбрать команду"}</button>` : ""}
  </header>`;
}
function bindTop() {
  $$(".tp").forEach(b => b.onclick = () => { TM.run = false; TM.left = TM.total = +b.dataset.t; tmDraw(); });
  $("#tmGo") && ($("#tmGo").onclick = () => { ac(); if (TM.run) { TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000)); TM.run = false; } else { if (TM.left <= 0) TM.left = TM.total; TM.end = Date.now() + TM.left * 1000; TM.run = true; } tmDraw(); });
  $("#tmRe") && ($("#tmRe").onclick = () => { TM.run = false; TM.left = TM.total; tmDraw(); });
  $("#qrBtn") && ($("#qrBtn").onclick = () => modal(`<h2>📱 Сканируйте — откроется станция на телефоне</h2><div class="bigqr">${qrSvg(stuUrl())}</div><p class="mut">${esc(stuUrl())}</p>`));
  $("#fsBtn") && ($("#fsBtn").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  $("#myTeam") && ($("#myTeam").onclick = pickTeam);
  tmDraw();
}
function modal(html) { $("#modal .mbody").innerHTML = html; $("#modal").hidden = false; }
$("#modal").onclick = e => { if (e.target.id === "modal" || e.target.classList.contains("mx")) { $("#modal").hidden = true; stopTuner(); } };
$("#tmOver").onclick = () => $("#tmOver").hidden = true;

function pickTeam(cb) {
  modal(`<h2>Какая у вас команда?</h2><div class="tpick">${D.teams.map((t, i) => `<button data-i="${i}" style="--c:${t.c}">${t.i}<b>${esc(t.n)}</b></button>`).join("")}</div>`);
  $$(".tpick button").forEach(b => b.onclick = () => { LS.set("team", +b.dataset.i); $("#modal").hidden = true; route(); typeof cb === "function" && cb(); });
}

/* ---------- маршруты ---------- */
function route() {
  stopTuner(); stopAnims();
  if (MODE === "visit") return visit();
  const h = location.hash.slice(1) || "home", [v, id] = h.split("/");
  app.innerHTML = topbar() + `<main id="view"></main>`; bindTop();
  if (MODE === "stu" && LS.get("team", null) == null) { home(); pickTeam(); return; }
  if (v === "st" && ST[id]) station(ST[id]); else if (v === "teacher" && MODE === "board") teacher(); else home();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

function home() {
  const v = $("#view");
  v.innerHTML = `<section class="hero"><div><h1>Сегодня мы — <span>изобретатели!</span></h1>
    <p>5 станций: звук, мосты, краски, программирование и выставка. Работаем командой, проверяем идеи опытом и собираем ⭐.</p></div>
    ${MODE === "board" ? `<div class="heroqr">${qrSvg(stuUrl())}<small>Сканируй — станция на телефоне</small></div>` : ""}</section>
    <section class="grid5">${D.stations.map((s, i) => `<a class="scard" href="#st/${s.id}" style="--c:${s.c};--s:${s.soft}">
      <span class="num">${i + 1}</span><span class="ico">${s.i}</span><b>${esc(s.title)}</b><small>${esc(s.q)}</small></a>`).join("")}</section>
    ${MODE === "board" ? `<section class="board-teams"><h2>⭐ Звёзды команд</h2><div class="teams" id="teamsBox"></div></section>` : `<section class="stu-ref"><h2>Как прошло занятие?</h2><div class="refl">${D.reflect.map((r, i) => `<button data-r="${i}">${r}</button>`).join("")}</div></section>`}`;
  if (MODE === "board") drawTeams();
  $$(".refl button").forEach(b => b.onclick = () => { const t = LS.get("team", 0); CL.post("reflect", { r: +b.dataset.r, t, ts: Date.now() }).catch(() => {}); LS.set("refl", +b.dataset.r); $$(".refl button").forEach(x => x.classList.toggle("on", x === b)); });
  const rv = LS.get("refl", null); if (rv != null) $$(".refl button")[rv]?.classList.add("on");
}
function drawTeams() { const b = $("#teamsBox"); if (!b) return; const mx = Math.max(1, ...D.teams.map((_, i) => starsOf(i)));
  b.innerHTML = D.teams.map((t, i) => `<div class="team" style="--c:${t.c}"><span class="ti">${t.i}</span><b>${esc(t.n)}</b><div class="bar"><i style="width:${starsOf(i) / mx * 100}%"></i></div><span class="sc">${starsOf(i)} ⭐</span></div>`).join(""); }
function refreshLive() { drawTeams(); drawBridgeBoard(); drawGallery(); drawRefl(); }

/* ---------- станция ---------- */
function station(s) {
  const v = $("#view"), idx = D.stations.indexOf(s), done = LS.get("done_" + s.id, []);
  v.innerHTML = `<section class="shead" style="--c:${s.c};--s:${s.soft}"><span class="ico">${s.i}</span><div><small>Станция ${idx + 1}</small><h1>${esc(s.title)}</h1><p class="q">❓ ${esc(s.q)}</p></div>${MODE === "board" ? `<div class="sqr">${qrSvg(stuUrl() + "#st/" + s.id, { c1: s.c, c2: "#14213D", eye: s.c, logo: s.i })}<small>станция на телефоне</small></div>` : ""}</section>
  <div class="cols" style="--c:${s.c};--s:${s.soft}">
    <div class="col">
      <div class="card goal"><h3>🎯 Наша цель</h3><p>${esc(s.goal)}</p></div>
      <div class="card"><h3>🧰 Нам понадобится</h3><ul class="mat">${s.mat.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
      <div class="card"><h3>👣 Шаги</h3><ol class="steps">${s.steps.map((t, i) => `<li data-i="${i}" class="${done.includes(i) ? "ok" : ""}"><span>${i + 1}</span><p>${esc(t)}</p></li>`).join("")}</ol></div>
      <div class="card safe"><h3>⚠️ Безопасность</h3><p>${esc(s.safe)}</p></div>
    </div>
    <div class="col">
      <div class="card widget" id="wbox"></div>
      <details class="card sci"><summary>🔬 Почему так? (наука)</summary><p>${esc(s.sci)}</p></details>
      <div class="card chal"><h3>🏆 Задание со звёздочкой</h3><p>${esc(s.chal)}</p></div>
      <div class="card rate"><h3>⭐ Звёзды станции</h3><ol class="crit">${s.stars.map(t => `<li>⭐ ${esc(t)}</li>`).join("")}</ol>${MODE === "board" ? `<div class="rteams">${D.teams.map((t, i) => `<div class="rt" data-t="${i}" style="--tc:${t.c}"><span>${t.i} ${esc(t.n)}</span><span class="st">${[1, 2, 3].map(n => `<button data-n="${n}" class="${getStar(i, s.id) >= n ? "on" : ""}">★</button>`).join("")}</span></div>`).join("")}</div>` : ""}</div>
    </div>
  </div>
  <nav class="snav">${idx > 0 ? `<a href="#st/${D.stations[idx - 1].id}">← ${esc(D.stations[idx - 1].title)}</a>` : `<a href="#home">← Все станции</a>`}${idx < D.stations.length - 1 ? `<a href="#st/${D.stations[idx + 1].id}">${esc(D.stations[idx + 1].title)} →</a>` : `<a href="#home">Все станции →</a>`}</nav>`;
  $$(".steps li").forEach(li => li.onclick = () => { const i = +li.dataset.i, d = LS.get("done_" + s.id, []); const k = d.indexOf(i); k < 0 ? d.push(i) : d.splice(k, 1); LS.set("done_" + s.id, d); li.classList.toggle("ok"); });
  $$(".rt").forEach(r => $$("button", r).forEach(b => b.onclick = () => { const t = +r.dataset.t, n = +b.dataset.n, cur = getStar(t, s.id); setStar(t, s.id, cur === n ? n - 1 : n); $$("button", r).forEach(x => x.classList.toggle("on", +x.dataset.n <= getStar(t, s.id))); if (getStar(t, s.id) === 3) beep(1); }));
  ({ tuner, bridge, chroma, blocks, gallery })[s.w]($("#wbox"), s);
}

/* ---------- 1. тюнер ---------- */
const NOTES = ["До", "До♯", "Ре", "Ре♯", "Ми", "Фа", "Фа♯", "Соль", "Соль♯", "Ля", "Ля♯", "Си"], LAT = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const TARGETS = [{ n: "Ре (D)", f: 146.83, s: "толстая струна" }, { n: "Соль (G)", f: 196.0, s: "тонкая струна" }];
let TU = null;
function tuner(box) {
  box.innerHTML = `<h3>🎚️ Тюнер для домбры</h3>
  <div class="tuner"><div class="tnote" id="tuN">—</div><div class="thz" id="tuF">нажми «Включить микрофон»</div>
    <div class="tscale"><i></i><b id="tuNd"></b><span>ниже</span><span>точно</span><span>выше</span></div>
    <div class="ttgt">${TARGETS.map((t, i) => `<button class="tt ${i ? "" : "on"}" data-i="${i}"><b>${t.n}</b><small>${t.s} · ${Math.round(t.f)} Гц</small></button>`).join("")}</div>
    <div class="row"><button class="btn big" id="tuOn">🎤 Включить микрофон</button><button class="btn" id="tuPlay">🔊 Послушать ноту</button></div>
    <p class="hint" id="tuH">Выбери струну, дёрни её и смотри на стрелку. Стрелка в центре — струна настроена!</p></div>`;
  let tgt = 0;
  $$(".tt", box).forEach(b => b.onclick = () => { tgt = +b.dataset.i; $$(".tt", box).forEach(x => x.classList.toggle("on", x === b)); });
  $("#tuPlay").onclick = () => tone(TARGETS[tgt].f, 2.2, "sawtooth", .12);
  $("#tuOn").onclick = async () => {
    if (TU) { stopTuner(); $("#tuOn").textContent = "🎤 Включить микрофон"; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const c = ac(); await c.resume(); const src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 4096; src.connect(an);
      const buf = new Float32Array(an.fftSize); let sm = 0;
      TU = { stream, raf: 0 }; $("#tuOn").textContent = "⏹ Выключить";
      let lastT = 0; const loop = (ts = 0) => { if (ts - lastT < 80) { TU && (TU.raf = requestAnimationFrame(loop)); return; } lastT = ts; an.getFloatTimeDomainData(buf); const f = pitch(buf, c.sampleRate);
        if (f > 60 && f < 1200) { sm = sm ? sm * .7 + f * .3 : f; const m = 69 + 12 * Math.log2(sm / 440), r = Math.round(m), nn = ((r % 12) + 12) % 12;
          $("#tuN").textContent = `${NOTES[nn]} · ${LAT[nn]}${Math.floor(r / 12) - 1}`; $("#tuF").textContent = `${sm.toFixed(1)} Гц`;
          const cents = 1200 * Math.log2(sm / TARGETS[tgt].f), cl = Math.max(-50, Math.min(50, cents));
          $("#tuNd").style.left = `${50 + cl}%`; const okk = Math.abs(cents) < 10;
          $("#tuNd").className = okk ? "ok" : ""; $("#tuH").textContent = okk ? "✅ Отлично! Струна настроена." : cents < 0 ? "⬆️ Звук ниже нужного — натяни струну сильнее." : "⬇️ Звук выше нужного — ослабь струну."; }
        TU && (TU.raf = requestAnimationFrame(loop)); };
      loop();
    } catch (e) { $("#tuH").textContent = "Микрофон недоступен. Разреши доступ к микрофону в браузере (сайт должен быть открыт по https)."; }
  };
}
function pitch(b, sr) { let rms = 0; for (const x of b) rms += x * x; rms = Math.sqrt(rms / b.length); if (rms < .01) return -1;
  const n = b.length, half = n >> 1; let best = -1, bc = 0; const c = new Float32Array(half);
  for (let lag = 20; lag < half; lag++) { let s = 0; for (let i = 0; i < half; i++) s += b[i] * b[i + lag]; c[lag] = s; }
  for (let lag = 40; lag < half - 1; lag++) if (c[lag] > c[lag - 1] && c[lag] >= c[lag + 1] && c[lag] > bc) { bc = c[lag]; best = lag; }
  // первый сильный пик (защита от октавных ошибок)
  let thr = bc * .85; for (let lag = 40; lag < half - 1; lag++) if (c[lag] > c[lag - 1] && c[lag] >= c[lag + 1] && c[lag] >= thr) { best = lag; break; }
  if (best < 0) return -1; const a = c[best - 1], m = c[best], z = c[best + 1], sh = (a - z) / (2 * (a - 2 * m + z)) || 0; return sr / (best + sh); }
function stopTuner() { if (!TU) return; cancelAnimationFrame(TU.raf); TU.stream.getTracks().forEach(t => t.stop()); TU = null; }

/* ---------- 2. мост ---------- */
const bridgeOf = () => Object.assign({}, LS.get("bridge", {}), CLOUD.bridge || {});
function bridge(box) {
  const me = MODE === "stu" ? LS.get("team", 0) : LS.get("bteam", 0); let cnt = 0;
  box.innerHTML = `<h3>🪙 Испытание моста</h3>
    ${MODE === "board" ? `<div class="tsel">${D.teams.map((t, i) => `<button data-i="${i}" class="${i === me ? "on" : ""}" style="--tc:${t.c}">${t.i} ${esc(t.n)}</button>`).join("")}</div>` : `<p class="mut">Команда: <b>${D.teams[me].i} ${esc(D.teams[me].n)}</b></p>`}
    <div class="coin"><button class="btn" id="bMinus">−1</button><div><b id="bCnt">0</b><small>монет на мосту</small></div><button class="btn big" id="bPlus">+1 🪙</button></div>
    <button class="btn red wide" id="bSave">🏁 Мост прогнулся — записать результат</button>
    <h4>Рекорды команд</h4><div class="bars" id="bBars"></div>`;
  let team = me;
  $$(".tsel button", box).forEach(b => b.onclick = () => { team = +b.dataset.i; LS.set("bteam", team); $$(".tsel button", box).forEach(x => x.classList.toggle("on", x === b)); cnt = 0; $("#bCnt").textContent = 0; });
  $("#bPlus").onclick = () => { cnt++; $("#bCnt").textContent = cnt; tone(1200 + cnt * 8, .12, "sine", .1); };
  $("#bMinus").onclick = () => { cnt = Math.max(0, cnt - 1); $("#bCnt").textContent = cnt; };
  $("#bSave").onclick = () => { const all = LS.get("bridge", {}); all[team] = Math.max(all[team] || 0, cnt); LS.set("bridge", all); CLOUD.bridge = CLOUD.bridge || {}; CLOUD.bridge[team] = Math.max(CLOUD.bridge[team] || 0, cnt);
    CL.put(`bridge/${team}`, CLOUD.bridge[team]).catch(() => {}); beep(2); drawBridgeBoard(); if (cnt >= 50) modal(`<h2>🏆 Супер-мост!</h2><p>${cnt} монет — вы настоящие инженеры!</p>`); };
  drawBridgeBoard();
}
function drawBridgeBoard() { const b = $("#bBars"); if (!b) return; const r = bridgeOf(), mx = Math.max(10, ...Object.values(r).map(Number));
  b.innerHTML = D.teams.map((t, i) => `<div class="brow"><span>${t.i} ${esc(t.n)}</span><div class="bar"><i style="width:${(r[i] || 0) / mx * 100}%;background:${t.c}"></i></div><b>${r[i] || 0}</b></div>`).join(""); }

/* ---------- 3. хроматография ---------- */
const COL = { "синий": "#2C6BED", "голубой": "#3DB8F0", "фиолетовый": "#7B3FD0", "розовый": "#F06BB5", "красный": "#E5322D", "оранжевый": "#F58A1F", "жёлтый": "#F7D31E", "зелёный": "#2DAA4A" };
const MARK = [{ n: "Чёрный", c: "#1d1d1f", r: ["жёлтый", "розовый", "фиолетовый", "синий"] }, { n: "Коричневый", c: "#7a4a22", r: ["жёлтый", "оранжевый", "красный"] },
  { n: "Зелёный", c: "#1f8a3a", r: ["жёлтый", "голубой"] }, { n: "Фиолетовый", c: "#6a2bb5", r: ["розовый", "синий"] }];
function chroma(box) {
  let mk = 0, pred = new Set();
  box.innerHTML = `<h3>🔮 Прогноз и опыт</h3><p class="mut">1) Выбери фломастер · 2) отметь цвета, которые, по-твоему, спрятаны · 3) запусти опыт.</p>
    <div class="mk">${MARK.map((m, i) => `<button data-i="${i}" class="${i ? "" : "on"}"><i style="background:${m.c}"></i>${m.n}</button>`).join("")}</div>
    <div class="sw">${Object.entries(COL).map(([n, c]) => `<button data-n="${n}" style="--sc:${c}"><i></i>${n}</button>`).join("")}</div>
    <div class="lab"><div class="strip" id="strip"><div class="water" id="water"></div><div class="dot" id="dot"></div><div class="bands" id="bands"></div></div>
      <div class="res" id="cres"><button class="btn big" id="cGo">💧 Запустить опыт</button><p class="mut">У разных марок фломастеров результат может немного отличаться — проверь на своей полоске!</p></div></div>`;
  const setMk = i => { mk = i; $("#dot").style.background = MARK[i].c; $("#bands").innerHTML = ""; $("#water").style.height = "8%"; };
  $$(".mk button", box).forEach(b => b.onclick = () => { $$(".mk button", box).forEach(x => x.classList.toggle("on", x === b)); setMk(+b.dataset.i); });
  $$(".sw button", box).forEach(b => b.onclick = () => { const n = b.dataset.n; pred.has(n) ? pred.delete(n) : pred.add(n); b.classList.toggle("on"); });
  setMk(0);
  $("#cGo").onclick = () => { const m = MARK[mk], bands = $("#bands"), w = $("#water"); bands.innerHTML = ""; $("#dot").style.opacity = 1;
    w.style.transition = "height 4s linear"; requestAnimationFrame(() => w.style.height = "88%");
    m.r.forEach((n, i) => { const el = document.createElement("i"); el.style.background = COL[n]; el.style.setProperty("--to", (22 + i * (60 / m.r.length)) + "%"); el.style.animationDelay = (0.3 + i * .35) + "s"; bands.appendChild(el); });
    setTimeout(() => { $("#dot").style.opacity = .25; const hit = m.r.filter(n => pred.has(n)).length, extraP = [...pred].filter(n => !m.r.includes(n)).length;
      $("#cres").innerHTML = `<h4>${m.n} фломастер =</h4><div class="chips">${m.r.map(n => `<span style="--sc:${COL[n]}" class="${pred.has(n) ? "hit" : ""}">${n}${pred.has(n) ? " ✓" : ""}</span>`).join("")}</div>
        <p>Угадано: <b>${hit} из ${m.r.length}</b>${extraP ? ` · лишних: ${extraP}` : ""}</p><p class="mut">${hit === m.r.length && !extraP ? "🏆 Прогноз точный — вы настоящие учёные!" : "Учёные тоже ошибаются в прогнозах — для этого и нужен опыт!"}</p><button class="btn" id="cAgain">↺ Ещё раз</button>`;
      $("#cAgain").onclick = () => chroma(box); }, 4300); };
}

/* ---------- 4. блоки ScratchJr ---------- */
const BL = { flag: { t: "⚑", n: "Старт", c: "#F5C518" }, rr: { t: "↻", n: "Повернуть вправо", c: "#3A86FF" }, rl: { t: "↺", n: "Повернуть влево", c: "#3A86FF" }, hop: { t: "⤴", n: "Прыгнуть", c: "#3A86FF" },
  grow: { t: "⊕", n: "Увеличить", c: "#9B5DE5" }, shrink: { t: "⊖", n: "Уменьшить", c: "#9B5DE5" }, snd: { t: "🎵", n: "Звук", c: "#2EC4B6" }, wait: { t: "⏱", n: "Ждать", c: "#FF9F1C" },
  rep: { t: "🔁×4", n: "Повторять 4 раза", c: "#FF9F1C" }, end: { t: "■", n: "Конец", c: "#E63946" } };
const LEVELS = [{ n: "Уровень 1", p: ["flag", "rr", "rr", "end"], d: "Орнамент поворачивается два раза." }, { n: "Уровень 2", p: ["flag", "rep", "rr", "grow", "shrink", "end"], d: "Цикл: поворот и «дыхание» 4 раза." },
  { n: "Уровень 3", p: ["flag", "snd", "rep", "rr", "hop", "grow", "shrink", "end"], d: "Музыка, прыжок и цикл — настоящий танец орнамента!" }];
const ORN = `<svg viewBox="-60 -60 120 120" class="orn"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M0 40 V8 C0 -18 -14 -36 -34 -34 C-52 -32 -54 -8 -40 -2 C-28 3 -20 -8 -27 -15" stroke="#C0392B" stroke-width="8"/>
  <path d="M0 8 C0 -18 14 -36 34 -34 C52 -32 54 -8 40 -2 C28 3 20 -8 27 -15" stroke="#C0392B" stroke-width="8"/>
  <path d="M-16 40 H16 M0 40 V52" stroke="#F2A900" stroke-width="7"/><circle cx="0" cy="-2" r="5" fill="#F2A900"/></g></svg>`;
let ANIMS = [];
function stopAnims() { ANIMS.forEach(a => { try { a.cancel(); } catch {} }); ANIMS = []; }
function blocks(box) {
  let prog = ["flag"];
  box.innerHTML = `<h3>🧩 Собери программу как в ScratchJr</h3>
    <div class="lv">${LEVELS.map((l, i) => `<button data-i="${i}"><b>${l.n}</b><small>${esc(l.d)}</small><span>${l.p.map(k => `<i style="--bc:${BL[k].c}">${BL[k].t}</i>`).join("")}</span></button>`).join("")}</div>
    <div class="pal">${Object.entries(BL).filter(([k]) => k !== "flag").map(([k, b]) => `<button data-k="${k}" style="--bc:${b.c}" title="${b.n}"><i>${b.t}</i><small>${b.n}</small></button>`).join("")}</div>
    <div class="prog" id="prog"></div>
    <div class="row"><button class="btn big" id="bRun">⚑ Запустить</button><button class="btn" id="bUndo">⌫ Убрать</button><button class="btn" id="bClr">🗑 Очистить</button></div>
    <div class="stage" id="stage">${ORN}</div><p class="hint" id="bHint">Нажимай на блоки — они встанут в программу. Начни с уровня 1!</p>`;
  const draw = () => $("#prog").innerHTML = prog.map(k => `<i style="--bc:${BL[k].c}" title="${BL[k].n}">${BL[k].t}</i>`).join("");
  $$(".pal button", box).forEach(b => b.onclick = () => { if (prog.at(-1) === "end") return; prog.push(b.dataset.k); draw(); });
  $$(".lv button", box).forEach(b => b.onclick = () => { $("#bHint").textContent = "Собери эту программу из блоков и нажми ⚑ Запустить: " + LEVELS[+b.dataset.i].d; });
  $("#bUndo").onclick = () => { if (prog.length > 1) prog.pop(); draw(); };
  $("#bClr").onclick = () => { prog = ["flag"]; draw(); };
  $("#bRun").onclick = async () => { stopAnims(); const el = $("#stage .orn"); let rot = 0, sc = 1, y = 0;
    const cmds = []; let rep = 1; for (const k of prog.slice(1)) { if (k === "end") break; if (k === "rep") { rep = 4; continue; } cmds.push(k); }
    const seq = [].concat(...Array(rep).fill(cmds));
    if (!seq.length) { $("#bHint").textContent = "Добавь хотя бы один блок после ⚑!"; return; }
    $("#bHint").textContent = rep > 1 ? `Цикл «Повторять» выполнил ${cmds.length} блок(а) 4 раза — это ${seq.length} команд!` : `Выполнено команд: ${seq.length}.`;
    for (const k of seq) { const from = `translateY(${y}px) rotate(${rot}deg) scale(${sc})`;
      if (k === "rr") rot += 90; if (k === "rl") rot -= 90; if (k === "grow") sc = Math.min(2, sc + .3); if (k === "shrink") sc = Math.max(.4, sc - .3);
      if (k === "snd") tone(523 + Math.random() * 300, .3, "sine", .15);
      const kf = k === "hop" ? [{ transform: from }, { transform: `translateY(${y - 40}px) rotate(${rot}deg) scale(${sc})` }, { transform: from }] : [{ transform: from }, { transform: `translateY(${y}px) rotate(${rot}deg) scale(${sc})` }];
      const a = el.animate(kf, { duration: k === "wait" ? 600 : 450, fill: "forwards", easing: "ease-in-out" }); ANIMS.push(a); await a.finished.catch(() => {}); }
  };
  draw();
}

/* ---------- 5. галерея ---------- */
const projOf = t => Object.assign({ title: "", text: "" }, LS.get("proj", {})[t] || {}, (CLOUD.proj || {})[t] || {});
const votesOf = t => { const v = (CLOUD.votes || {})[t] || {}; const a = Object.values(v); return { n: a.length, s: a.reduce((x, y) => x + (+y.s || 0), 0) }; };
function gallery(box) {
  box.innerHTML = `<h3>🖼️ Выставка: QR-карточки команд</h3>${MODE === "board" ? `<p class="mut">Впишите название проекта и одно предложение. Гости сканируют QR и ставят ⭐.</p>` : `<p class="mut">Попроси учителя вписать название вашего проекта на доске.</p>`}
    <div class="gal" id="gal"></div>${MODE === "board" ? `<button class="btn wide" id="gPrint">🖨️ Распечатать QR-карточки</button>` : ""}`;
  drawGallery();
  $("#gPrint") && ($("#gPrint").onclick = () => { const w = $("#printArea"); w.className = ""; w.innerHTML = D.teams.map((t, i) => { const p = projOf(i); return `<div class="pcard" style="--c:${t.c}"><div class="ph">${t.i} ${esc(t.n)}</div><h2>${esc(p.title || "Наше изобретение")}</h2><p>${esc(p.text || "")}</p><div class="pq">${qrSvg(projUrl(i), { c1: t.c, c2: "#14213D", eye: t.c, logo: t.i })}</div><small>Сканируй и поставь ⭐</small></div>`; }).join(""); window.print(); });
}
function drawGallery() { const g = $("#gal"); if (!g || g.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
  g.innerHTML = D.teams.map((t, i) => { const p = projOf(i), v = votesOf(i); return `<div class="gcard" style="--c:${t.c}"><div class="gh">${t.i} ${esc(t.n)}</div>
    ${MODE === "board" ? `<input data-t="${i}" data-f="title" placeholder="Название проекта" value="${esc(p.title)}"><input data-t="${i}" data-f="text" placeholder="1 предложение: что это и как работает" value="${esc(p.text)}">` : `<b>${esc(p.title || "—")}</b><p>${esc(p.text)}</p>`}
    <div class="gq">${qrSvg(projUrl(i), { c1: t.c, c2: "#14213D", eye: t.c, logo: t.i })}</div><div class="gv">⭐ ${v.s} <small>(${v.n} гостей)</small></div></div>`; }).join("");
  $$(".gcard input", g).forEach(inp => inp.onchange = () => { const t = +inp.dataset.t, all = LS.get("proj", {}); all[t] = Object.assign(projOf(t), { [inp.dataset.f]: inp.value }); LS.set("proj", all);
    CLOUD.proj = CLOUD.proj || {}; CLOUD.proj[t] = all[t]; CL.put(`proj/${t}`, all[t]).catch(() => {}); });
}

/* ---------- страница учителя ---------- */
function teacher() {
  const allMat = [...new Set(D.stations.flatMap(s => s.mat))];
  $("#view").innerHTML = `<section class="shead" style="--c:#14213D;--s:#EEF2FA"><span class="ico">👩‍🏫</span><div><small>Для учителя</small><h1>План занятия · 45 минут</h1><p class="q">Станционная работа: 5 команд, 4 станции по 7 минут + галерея.</p></div></section>
  <div class="cols" style="--c:#14213D;--s:#EEF2FA"><div class="col">
    <div class="card"><h3>⏱ Ход занятия</h3><table class="plan">${D.plan.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join("")}</table></div>
    <div class="card"><h3>🎯 Цели</h3><ul>${D.goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>
    <div class="card"><h3>💛 Ценности</h3><p>${esc(D.values)}</p></div>
  </div><div class="col">
    <div class="card"><h3>⭐ Оценивание</h3><p>На каждой станции команда получает до 3 звёзд по критериям (кнопки ★ на странице станции). Максимум — 15 ⭐. Звёзды гостей в галерее — отдельный приз «Выбор зрителей».</p></div>
    <div class="card"><h3>🧰 Общий список материалов</h3><ul class="mat">${allMat.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
    <div class="card"><h3>🚦 Рефлексия учеников</h3><div id="reflBox"></div><p class="mut">Ученики нажимают на телефоне на главной странице.</p></div>
    <div class="card"><h3>🖨️ Для лаборатории</h3><p>Карточки станций на столы: цель, материалы, шаги, безопасность и QR станции.</p><button class="btn wide" id="printSt">🖨️ Распечатать карточки станций (A4)</button></div>
    <div class="card"><h3>🧹 Новый урок</h3><button class="btn red" id="resetAll">Очистить звёзды, рекорды и голоса</button><p class="mut">Облако: ${CL.ok ? "подключено ✅" : "не подключено — данные только на этом компьютере"}</p></div>
  </div></div>`;
  drawRefl();
  $("#printSt").onclick = () => { $("#printArea").className = "pst"; $("#printArea").innerHTML = D.stations.map((s, i) => `<div class="stc" style="--c:${s.c};--s:${s.soft}">
    <div class="stch"><span>${s.i}</span><div><small>Станция ${i + 1}</small><h2>${esc(s.title)}</h2><p>❓ ${esc(s.q)}</p></div><div class="stq">${qrSvg(stuUrl() + "#st/" + s.id, { c1: s.c, c2: "#14213D", eye: s.c, logo: s.i })}</div></div>
    <p class="g">🎯 ${esc(s.goal)}</p><h3>🧰 Материалы</h3><ul>${s.mat.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
    <h3>👣 Шаги</h3><ol>${s.steps.map(t => `<li>${esc(t)}</li>`).join("")}</ol><p class="sf">⚠️ ${esc(s.safe)}</p><p class="ch">🏆 ${esc(s.chal)}</p>
    <div class="cr">⭐ ${s.stars.map(esc).join(" · ⭐ ")}</div></div>`).join(""); window.print(); };
  $("#resetAll").onclick = () => { if (!confirm("Очистить все результаты?")) return; ["stars", "bridge", "proj"].forEach(k => LS.set(k, {})); CLOUD = { stars: {}, bridge: {}, votes: {}, proj: {}, reflect: {} }; CL.del("").catch(() => {}); route(); };
}
function drawRefl() { const b = $("#reflBox"); if (!b) return; const c = [0, 0, 0]; Object.values(CLOUD.reflect || {}).forEach(r => c[r.r] = (c[r.r] || 0) + 1);
  b.innerHTML = D.reflect.map((r, i) => `<div class="brow"><span>${r}</span><div class="bar"><i style="width:${c[i] / Math.max(1, ...c) * 100}%;background:${["#2DAA4A", "#F2A900", "#E5322D"][i]}"></i></div><b>${c[i]}</b></div>`).join(""); }

/* ---------- страница проекта для гостей ---------- */
async function visit() {
  const t = Math.max(0, Math.min(D.teams.length - 1, +Q.get("p") || 0)), tm = D.teams[t];
  app.innerHTML = `<main class="visit" style="--c:${tm.c}"><div class="vh"><span>${tm.i}</span><small>Галерея изобретателей · команда</small><h1>${esc(tm.n)}</h1></div><div class="card" id="vp"><p class="mut">Загрузка…</p></div>
    <div class="card"><h3>Поставь звёзды изобретателям!</h3><div class="vs">${[1, 2, 3].map(n => `<button data-n="${n}">${"⭐".repeat(n)}</button>`).join("")}</div><p class="mut" id="vMsg"></p></div>
    <p class="mut center">💡 ${esc(D.title)} · STEM-занятие</p></main>`;
  try { CLOUD.proj = (await CL.get("proj")) || {}; } catch {}
  const p = projOf(t); $("#vp").innerHTML = `<h2>${esc(p.title || "Наше изобретение")}</h2><p>${esc(p.text || "Спросите авторов — они с радостью расскажут!")}</p>`;
  const voted = LS.get("voted_" + t, 0); if (voted) $("#vMsg").textContent = `Спасибо! Вы поставили ${"⭐".repeat(voted)}`;
  $$(".vs button").forEach(b => b.onclick = async () => { if (LS.get("voted_" + t, 0)) return; const n = +b.dataset.n;
    try { await CL.post(`votes/${t}`, { s: n, ts: Date.now() }); LS.set("voted_" + t, n); $("#vMsg").textContent = `Спасибо! Вы поставили ${"⭐".repeat(n)}`; beep(1); } catch { $("#vMsg").textContent = "Нет интернета — попробуйте ещё раз."; } });
}

route();
if (CL.ok && MODE !== "visit") { pull(); setInterval(pull, MODE === "board" ? 3000 : 8000); }
})();

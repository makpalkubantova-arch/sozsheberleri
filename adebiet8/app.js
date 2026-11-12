/* «Сөз сарайының кілті» — көне кітап түріндегі ашық сабақ. Тақта (әдепкі), оқушы телефоны (?m=s). */
(() => {
const D = window.DATA, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = new URLSearchParams(location.search), MODE = Q.get("m") === "s" ? "stu" : "board";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = { get(k, d) { try { const v = localStorage.getItem("ss_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("ss_" + k, JSON.stringify(v)); } catch {} } };
const SITE = location.href.split(/[?#]/)[0], TOOL = Object.fromEntries(D.tools.map(t => [t.k, t]));
const MAIN = D.tools.filter(t => !t.hidden);
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

/* ---------- бұлт (Firebase REST) ---------- */
const CL = (() => { const url = (D.live.url || "").replace(/\/+$/, ""), room = D.live.room + (Q.get("t") ? "-" + Q.get("t").replace(/[^\w-]/g, "") : "");
  const ok = /^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(url);
  const r = async (p, m = "GET", b) => { if (!ok) throw 0; const x = await fetch(`${url}/${room}/${p}.json`, { method: m, headers: { "Content-Type": "application/json" }, body: b == null ? undefined : JSON.stringify(b) }); if (!x.ok) throw 0; return x.json(); };
  return { ok, get: p => r(p), put: (p, v) => r(p, "PUT", v), post: (p, v) => r(p, "POST", v), del: p => r(p, "DELETE") }; })();
let CLOUD = {};
const stuUrl = () => SITE + "?m=s" + (Q.get("t") ? "&t=" + encodeURIComponent(Q.get("t")) : "");
const qrSvg = (text, c1 = "#7A1E14", c2 = "#2B1D12") => { const q = qrcode(0, "H"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 3, S = n + m * 2;
  const inF = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8), L = Math.ceil(n * .22), lo = Math.floor((n - L) / 2), inL = (x, y) => x >= lo && x < lo + L && y >= lo && y < lo + L;
  let d = ""; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x) && !inF(x, y) && !inL(x, y)) d += `<circle cx="${x + m + .5}" cy="${y + m + .5}" r=".47"/>`;
  const eye = (x, y) => `<rect x="${x + m + .5}" y="${y + m + .5}" width="6" height="6" rx="2" fill="none" stroke="${c2}"/><rect x="${x + m + 2}" y="${y + m + 2}" width="3" height="3" rx="1" fill="${c1}"/>`, cx = m + n / 2;
  return `<svg viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="#fff"/><defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><g fill="url(#qg)">${d}</g>${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}
  <circle cx="${cx}" cy="${cx}" r="${L / 2 + .2}" fill="#fff" stroke="${c1}" stroke-width=".6"/><text x="${cx}" y="${cx}" font-size="${L * .62}" text-anchor="middle" dominant-baseline="central">🪶</text></svg>`; };

/* ---------- дыбыс ---------- */
let AC; const ac = () => (AC = AC || new (window.AudioContext || window.webkitAudioContext)());
function rustle() { try { const c = ac(), len = c.sampleRate * .5, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2) * (0.4 + 0.6 * Math.sin(i / len * Math.PI));
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = .6; g.gain.value = .35; s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start(); } catch {} }
function chime(ok = true) { try { const c = ac(); (ok ? [660, 880, 1320] : [220, 180]).forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = ok ? "sine" : "square"; o.frequency.value = f;
  g.gain.setValueAtTime(ok ? .12 : .06, c.currentTime + i * .09); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + i * .09 + .5); o.connect(g).connect(c.destination); o.start(c.currentTime + i * .09); o.stop(c.currentTime + i * .09 + .55); }); } catch {} }

/* ---------- безендіру SVG ---------- */
const ORN = `<svg class="orn" viewBox="0 0 60 60"><g fill="none" stroke="#8C6A22" stroke-width="2.2" stroke-linecap="round"><path d="M6 54 V20 C6 10 12 6 20 6 H54"/><path d="M12 48 C12 30 18 16 30 14 C40 12 42 24 34 26 C28 28 26 20 30 19"/><path d="M48 12 C30 12 16 18 14 30 C12 40 24 42 26 34 C28 28 20 26 19 30"/></g></svg>`;
const ORNS = ["tl", "tr", "bl", "br"].map(p => ORN.replace('class="orn"', `class="orn ${p}"`)).join("");
const CORNER = `<svg viewBox="0 0 110 110"><g fill="none" stroke="#D9B45E" stroke-width="3" stroke-linecap="round"><path d="M6 104 V30 C6 14 14 6 30 6 H104"/><path d="M18 92 C18 56 30 30 54 26 C74 22 78 46 62 50 C50 53 46 38 54 36"/><path d="M92 18 C56 18 30 30 26 54 C22 74 46 78 50 62 C53 50 38 46 36 54"/><circle cx="20" cy="20" r="5" fill="#D9B45E"/></g></svg>`;
const MEDAL = `<svg class="medal" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="none" stroke="#D9B45E" stroke-width="3"/><circle cx="75" cy="75" r="58" fill="none" stroke="#D9B45E" stroke-width="1.5" stroke-dasharray="3 5"/>
 <g fill="none" stroke="#F3D58E" stroke-width="5" stroke-linecap="round"><path d="M75 112 V80 C75 56 62 40 44 42 C28 44 28 64 40 68 C50 71 56 60 50 54"/><path d="M75 80 C75 56 88 40 106 42 C122 44 122 64 110 68 C100 71 94 60 100 54"/></g><path d="M58 112 H92" stroke="#F3D58E" stroke-width="5" stroke-linecap="round"/></svg>`;
const DECO = `<svg class="deco quill" viewBox="0 0 200 60"><path d="M4 30 C60 4 140 -2 196 10 C150 20 90 40 4 30Z" fill="#EFE6D2"/><path d="M4 30 C70 24 140 14 196 10" stroke="#B9A98A" stroke-width="1.5" fill="none"/>
 ${Array.from({ length: 18 }, (_, i) => `<path d="M${30 + i * 9} ${27 - i * .9} l${6} ${-9 + i * .2}" stroke="#CFC2A6" stroke-width="1"/>`).join("")}<path d="M0 31 L-14 34" stroke="#3A2A1A" stroke-width="3"/></svg>
 <svg class="deco inkpot" viewBox="0 0 110 100"><ellipse cx="55" cy="92" rx="50" ry="8" fill="#0008"/><path d="M14 40 C14 28 96 28 96 40 V82 C96 92 14 92 14 82Z" fill="#1E2A38"/><path d="M14 40 C14 50 96 50 96 40" fill="#2E4258"/><rect x="38" y="18" width="34" height="18" rx="4" fill="#C9A04A"/><ellipse cx="55" cy="18" rx="17" ry="5" fill="#0B0F14"/><path d="M24 50 C30 70 30 80 26 86" stroke="#ffffff22" stroke-width="5" fill="none"/></svg>
 <svg class="deco candle" viewBox="0 0 120 240"><ellipse cx="60" cy="232" rx="56" ry="8" fill="#0008"/><ellipse cx="60" cy="214" rx="54" ry="14" fill="#8C6A22"/><rect x="34" y="70" width="52" height="144" rx="6" fill="#F2E6CC"/><path d="M34 80 C44 92 50 84 56 98 C60 88 70 96 86 82" fill="#E6D6B0"/><path d="M60 70 V58" stroke="#2B1D12" stroke-width="3"/>
 <g class="flame"><path d="M60 14 C76 36 72 56 60 60 C48 56 44 36 60 14Z" fill="#FFB43A"/><path d="M60 30 C68 42 66 54 60 56 C54 54 52 42 60 30Z" fill="#FFF1B0"/></g><circle cx="60" cy="40" r="46" fill="#FFC86B" opacity=".12"/></svg>`;

/* ---------- таймер (құм сағат) ---------- */
const TM = { left: 120, total: 120, run: false, end: 0 };
function tmDraw() { const l = Math.max(0, TM.run ? Math.round((TM.end - Date.now()) / 1000) : TM.left), el = $("#tmT"); if (!el) return;
  el.textContent = `${String(Math.floor(l / 60)).padStart(2, "0")}:${String(l % 60).padStart(2, "0")}`; const w = $(".hglass"); w.classList.toggle("warn", TM.run && l <= 20); w.classList.toggle("run", TM.run);
  $("#tmGo").textContent = TM.run ? "❚❚" : "▶"; if (TM.run && l <= 0) { TM.run = false; TM.left = 0; chime(false); setTimeout(() => chime(false), 400); } }
setInterval(tmDraw, 250);
const tmSet = m => { TM.run = false; TM.left = TM.total = m * 60; tmDraw(); };

/* ---------- тақта ---------- */
let cur = LS.get("ch", 0), busy = false;
function fit() { const s = $("#stage"); if (!s) return; const k = Math.min(innerWidth / 1600, innerHeight / 900); s.style.transform = `translate(-50%,-50%) scale(${k})`; }
addEventListener("resize", fit);

function board() {
  $("#root").innerHTML = `<div id="stage">${DECO}
    <div class="hud"><div class="brand">📜 ${esc(D.title)}<small>Қазақ әдебиеті · ${esc(D.grade)} · ${esc(D.teacher)}</small></div><div class="sp"></div>
      <div class="hglass"><span class="sand">⏳</span><b id="tmT">02:00</b><button id="tmGo">▶</button><button id="tmRe">↺</button></div>
      <button class="hbtn" id="qrB">🪶 QR</button><button class="hbtn" id="fsB">⛶</button></div>
    <div class="ribbons">${D.chapters.map((c, i) => `<button class="rib" data-i="${i}" style="--rc:${["#7A1E14", "#8C5A1E", "#2C5F7C", "#5E6B2B", "#9B2C2C", "#5B3F8C", "#7A4E9C", "#2C5F7C", "#8C6A22"][i]}">${i ? i : "✦"}<small>${esc(c.n)}</small></button>`).join("")}</div>
    <div class="book"><div class="tilt"><div class="cover-back"></div>
      <div class="pg L" id="pL"></div><div class="pg R" id="pR"></div><div class="spine"></div></div></div>
    <button class="nav prev" id="prv">‹</button><button class="nav next" id="nxt">›</button><div class="chap" id="chapN"></div>
    <div class="closed" id="closed"><div class="lcover">${["a", "b", "c", "d"].map(k => `<div class="corner ${k}">${CORNER}</div>`).join("")}
      ${MEDAL}<h1>${esc(D.title)}</h1><div class="sub">${esc(D.topic)}</div>
      <div class="meta">Қазақ әдебиеті · ${esc(D.grade)}<br>${esc(D.teacher)} · ${esc(D.role)}<br>${esc(D.school)}</div>
      <button class="btn gold open-btn" id="openB">📖 Кітапты ашу</button></div></div>
  </div>`;
  fit();
  $("#tmGo").onclick = () => { ac(); if (TM.run) { TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000)); TM.run = false; } else { if (TM.left <= 0) TM.left = TM.total; TM.end = Date.now() + TM.left * 1000; TM.run = true; } tmDraw(); };
  $("#tmRe").onclick = () => tmSet(TM.total / 60);
  $("#qrB").onclick = () => modal(`<h2>🪶 Телефонмен сканерле</h2><p class="muted">Тобыңды таңда, «Сөз сынағына» және кері байланысқа қатыс.</p><div style="text-align:center"><div class="qrbox">${qrSvg(stuUrl())}</div></div><p class="small muted" style="word-break:break-all">${esc(stuUrl())}</p>`);
  $("#fsB").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
  $("#openB").onclick = () => { ac(); rustle(); $("#closed").classList.add("open"); LS.set("opened", 1); };
  if (LS.get("opened", 0)) $("#closed").classList.add("open");
  $("#prv").onclick = () => go(cur - 1); $("#nxt").onclick = () => go(cur + 1);
  $$(".rib").forEach(b => b.onclick = () => go(+b.dataset.i));
  addEventListener("keydown", e => { if (e.target.tagName === "INPUT") return; if (e.key === "ArrowRight" || e.key === "PageDown") go(cur + 1); if (e.key === "ArrowLeft" || e.key === "PageUp") go(cur - 1); });
  render(cur, true);
}
const pageWrap = (html, side, no) => `${ORNS}<div class="content">${html}</div><div class="pno">— ${no} —</div>`;
function render(i, first) {
  const [l, r] = SPREAD[D.chapters[i].k]();
  $("#pL").innerHTML = pageWrap(l, "L", i * 2 + 1); $("#pR").innerHTML = pageWrap(r, "R", i * 2 + 2);
  $$(".rib").forEach((b, k) => b.classList.toggle("on", k === i)); $("#chapN").textContent = `${i ? i + "-тарау · " : ""}${D.chapters[i].n} · ${D.chapters[i].m} мин`;
  if (!first || !TM.run) tmSet(D.chapters[i].m);
  (BIND[D.chapters[i].k] || (() => {}))();
}
function go(i) {
  if (busy || i < 0 || i >= D.chapters.length || i === cur) return; busy = true; ac(); rustle();
  const fwd = i > cur, book = $(".tilt"), leaf = document.createElement("div"); leaf.className = "leaf " + (fwd ? "fwd" : "bwd");
  const oldL = $("#pL").innerHTML, oldR = $("#pR").innerHTML, [nl, nr] = SPREAD[D.chapters[i].k]();
  const newL = pageWrap(nl, "L", i * 2 + 1), newR = pageWrap(nr, "R", i * 2 + 2);
  leaf.innerHTML = fwd ? `<div class="face front"><div class="pg R" style="right:auto;left:0">${oldR}</div></div><div class="face back"><div class="pg L">${newL}</div></div>`
    : `<div class="face front"><div class="pg L">${oldL}</div></div><div class="face back"><div class="pg R" style="right:auto;left:0">${newR}</div></div>`;
  book.appendChild(leaf);
  if (fwd) $("#pR").innerHTML = newR; else $("#pL").innerHTML = newL;
  requestAnimationFrame(() => requestAnimationFrame(() => { leaf.style.transform = `rotateY(${fwd ? -180 : 180}deg)`; }));
  setTimeout(() => { cur = i; LS.set("ch", i); leaf.remove(); render(i); busy = false; }, 980);
}
function modal(h) { $("#modal .mbody").innerHTML = h; $("#modal").hidden = false; }
$("#modal").onclick = e => { if (e.target.id === "modal" || e.target.classList.contains("mx")) $("#modal").hidden = true; };

/* ---------- тараулар: [сол бет, оң бет] ---------- */
const kick = (t) => `<div class="kick">${t}</div>`;
const SPREAD = {
  cover: () => [
    `<div style="text-align:center;margin-top:30px">${MEDAL.replace('class="medal"', 'class="medal" style="filter:sepia(1) saturate(2) brightness(.6)"')}<p class="kick">Ex libris</p><h3 style="margin-top:6px">${esc(D.school)}</h3><div class="rule"></div>
      <p class="muted">${esc(D.teacher)}<br>${esc(D.role)}</p><p class="muted small">${esc(D.grade)}${D.date ? " · " + esc(D.date) : ""}${D.time ? " · " + esc(D.time) : ""}</p>
      <div class="rule"></div><p style="font:italic 500 24px/1.35 var(--hf);margin:20px 30px">«Өнер алды — қызыл тіл».</p><p class="small muted">— халық мақалы</p></div>`,
    `<div style="text-align:center;margin-top:60px">${kick("Ашық сабақ")}<h1 style="margin:16px 0">${esc(D.title)}</h1><div class="rule"></div>
      <p style="font:italic 500 26px/1.35 var(--hf);margin:16px 20px">${esc(D.topic)}</p><div class="rule"></div>
      <p class="muted" style="margin-top:28px">Қорқыт · Шалкиіз · Ақтамберді · Шәкәрім · Д. Исабеков</p>
      <p style="margin-top:40px"><span class="seal">Ә</span></p><p class="small muted">Бетбелгіні не › батырмасын бас</p></div>`],
  open: () => [
    `${kick("1-тарау")}<h2 class="drop">Кітап ашылды</h2><div class="rule"></div>
     <h3>Сабақтың мақсаты</h3>${D.obj.map(o => `<p style="margin:8px 0">${o[0] ? `<b style="color:var(--red)">${o[0]}</b> — ` : "• "}${esc(o[1])}</p>`).join("")}
     <h3 style="margin-top:14px">Бағалау критерийі</h3><table class="rub">${D.rubric.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>
     <p class="small muted" style="margin-top:12px">💛 ${esc(D.value)}</p>`,
    `${kick("Топқа бөліну")}<h2>Үш тарау — үш топ</h2><div class="rule"></div>
     <div>${D.groups.map(g => `<span class="gpill" style="--gc:${g.c}">${g.i} ${esc(g.n)} <b id="gc${D.groups.indexOf(g)}" style="background:#fff3;border-radius:20px;padding:0 8px">0</b></span>`).join("")}</div>
     <div style="display:flex;gap:22px;align-items:center;margin-top:20px"><div class="qrbox">${qrSvg(stuUrl())}</div>
      <div><p style="font:italic 500 24px/1.3 var(--hf)">Телефонмен сканерле де, тобыңды таңда.</p><p class="muted small">Топ аттары — сабақтағы шығармалар әлемі: жыраулар, дала даналығы, сахна.</p></div></div>`],
  chest: () => {
    const defs = shuffle(D.match.map(k => ({ k, d: TOOL[k].d })));
    return [`${kick("2-тарау · білімді жаңғырту")}<h2 class="drop">Сөз сандығы</h2><p class="muted small">Анықтаманы таңда да, оң жақтағы дұрыс құлыпқа бас. Құлып ашылса — кілт табылды!</p>
      <div class="slips">${defs.map((x, i) => `<button class="slip" data-k="${x.k}" style="--r:${(i % 2 ? 1 : -1) * (0.4 + i * .15)}deg">${esc(x.d)}</button>`).join("")}</div>`,
     `${kick("Алты құлып")}<h2>Сандықты аш</h2><div class="locks">${D.match.map(k => `<button class="lock" data-k="${k}"><span class="ki">🔒</span><span>${esc(TOOL[k].n)}<small>${esc(TOOL[k].who.split(" · ")[0])}</small></span></button>`).join("")}</div>
      <p class="fb" id="chFb">Ашылған құлып: <b id="chN">0</b> / 6</p>`];
  },
  library: () => {
    const card = t => `<button class="fcard" data-k="${t.k}" style="--ic:${t.ink}"><div class="in"><div class="fs front"><span class="ti">${t.ic}</span><span><b>${esc(t.n)}</b><small>${esc(t.who)}</small></span></div>
      <div class="fs back"><b>${esc(t.n)}</b><span>${esc(t.d)}</span><span class="small" style="opacity:.9">📜 Мысалын ашу үшін тағы бас</span></div></div></button>`;
    return [`${kick("3-тарау · құралдар кітапханасы")}<h2 class="drop" style="font-size:36px">Алты құрал</h2><div class="cards">${MAIN.slice(0, 3).map(card).join("")}</div>`,
      `<div style="height:44px"></div><div class="cards">${MAIN.slice(3).map(card).join("")}</div>`];
  },
  detective: () => [
    `${kick("4-тарау · мәтін детективі")}<h2 class="drop">Сөздің ізімен</h2><p class="muted small">Үзіндіні оқы. Онда қай көркемдегіш құрал «жасырынған»?</p>
      <div class="dots" id="dDots"></div><div class="who" id="dWho"></div><div class="excerpt" id="dTxt"></div>`,
    `${kick("Мөрді бас")}<h2>Бұл қай құрал?</h2><div class="seals">${MAIN.map(t => `<button class="sealbtn" data-k="${t.k}" style="--sc:${t.ink}"><i>${t.ic}</i>${esc(t.n)}</button>`).join("")}</div>
      <div class="fb" id="dFb"></div><button class="btn gold" id="dNext" style="display:none">Келесі үзінді ›</button>`],
  passport: () => [
    `${kick("5-тарау · топтық жұмыс")}<h2 class="drop">Стиль паспорты</h2><p class="muted small">Әр топ бір қаламгерді таңдап, оның стилін «паспортқа» түсіреді: қандай құрал? не үшін? қандай мәнер?</p>
      <div class="authors">${D.authors.map((a, i) => `<button class="au" data-i="${i}"><span class="md">${esc(a.n[0])}</span><span><b>${esc(a.n)}</b><small>${esc(a.w)}<br>${D.groups[a.g].i} ${esc(D.groups[a.g].n)}</small></span></button>`).join("")}</div>
      <p class="small muted" style="margin-top:12px">Стиль — қаламгердің жазу мәнері, ой түйінін ашу тәсілі, образдар жүйесінің тұрақты бірлігі.</p>`,
    `<div id="ppBox"><div style="text-align:center;margin-top:120px"><span class="seal">?</span><p style="font:italic 500 26px var(--hf)">Сол жақтан қаламгерді таңда</p></div></div>`],
  scale: () => [
    `${kick("6-тарау · 8.1.2.1")}<h2 class="drop" style="font-size:38px">Есімдер айнасы</h2>
      <p class="small">«Әпке» пьесасында кейіпкерлер өз есімдерін «сәнге» айналдырады. Айнаға бас — шын есімі қайтып оралады.</p>
      <div class="mirror">${D.names.map(([a, b]) => `<button class="mr"><div class="in"><div class="fs a">${esc(b)}</div><div class="fs b">${esc(a)}</div></div></button>`).join("")}</div>
      <p style="font:italic 500 22px/1.35 var(--hf)">Есім — ұлттың жады. Автор күлкі (сатира) арқылы ұлттық болмыстан айырылудың қаупін көрсетеді.</p>
      <p class="small muted">Пафос — шығарманың рухы, автор сезімінің қуаты: батырлық, патриоттық, философиялық, драмалық, сатиралық…</p>`,
    `${kick("Ұлттық мүдде таразысы")}<h2 style="font-size:36px">Идея мен пафос</h2><p class="small muted">Шығарманы таңда, сосын оның пафосына сай табаққа бас. Бәрі орнын тапса — таразы теңеледі.</p>
      <div class="wlist" id="wl">${D.works.map((w, i) => `<button class="wchip" data-i="${i}">${esc(w.n)}</button>`).join("")}</div>
      <div class="scale"><div class="post"></div><div class="beam" id="beam"></div><div class="crown" id="crown">⚖️</div>
       <div class="pans">${D.pafos.map(p => `<button class="pan" data-k="${p.k}" style="--pc:${p.c}"><div class="bowl"><span class="lbl">${esc(p.n)}</span></div></button>`).join("")}</div><div class="base"></div></div>
      <div class="fb small" id="sFb"></div>`],
  quiz: () => [
    `${kick("7-тарау · сөз сынағы")}<h2 class="drop">Телефон — қаламың</h2><p>Сканерле, тобыңды таңда, 8 сұраққа жауап бер.</p>
      <div style="text-align:center"><div class="qrbox">${qrSvg(stuUrl())}</div></div><h3 style="margin-top:14px">Топтар жарысы</h3><div class="lb" id="lb"></div>`,
    `${kick("Тақтадағы сұрақ")}<div class="dots" id="qDots"></div><h3 id="qQ" style="font-size:30px;margin:8px 0"></h3><div class="quiz-o" id="qO"></div>
      <div style="display:flex;gap:10px;margin-top:14px"><button class="btn ghost" id="qPrev">‹</button><button class="btn gold" id="qShow">Жауабын көрсету</button><button class="btn" id="qNext">Келесі ›</button></div>`],
  final: () => [
    `${kick("8-тарау · рефлексия")}<h2 class="drop">Қауырсын қалам</h2><p class="small muted">Телефоннан белгіле: бүгінгі сабақтан кейін сенің қаламың қандай?</p>
      <div id="rfl"></div><h3 style="margin-top:16px">Өзін-өзі бағалау</h3><table class="rub">${D.rubric.map(r => `<tr><td>${esc(r[0])}</td><td>☐ ☐ ☐</td></tr>`).join("")}</table>`,
    `${kick("Үй тапсырмасы")}<h2>Таңдау бойынша</h2><div class="rule"></div>${D.homework.map(h => `<div class="hw"><span class="seal">${h[0]}</span><p style="margin:4px 0">${esc(h[1])}</p></div>`).join("")}
      <div style="text-align:center;margin-top:26px"><p style="font:italic 500 28px/1.3 var(--hf)">Сөз — сарай, оның кілті — оқырманның жүрегінде.</p><span class="seal" style="width:90px;height:90px;font-size:22px">Соңы</span></div>`]
};

/* ---------- интерактив ---------- */
const BIND = {
  open() { drawJoin(); },
  chest() { let sel = null, n = 0;
    $$(".slip").forEach(b => b.onclick = () => { $$(".slip").forEach(x => x.classList.remove("sel")); sel = b; b.classList.add("sel"); });
    $$(".lock").forEach(l => l.onclick = () => { if (!sel || l.classList.contains("ok")) return;
      if (sel.dataset.k === l.dataset.k) { l.classList.add("ok"); $(".ki", l).textContent = "🗝️"; sel.classList.add("done"); sel.classList.remove("sel"); sel = null; n++; $("#chN").textContent = n; chime(true);
        if (n === 6) $("#chFb").innerHTML = "🎉 <b>Сандық ашылды!</b> Алты кілттің бәрі сенде."; }
      else { l.classList.remove("bad"); void l.offsetWidth; l.classList.add("bad"); chime(false); } }); },
  library() { $$(".fcard").forEach(c => c.onclick = () => { if (!c.classList.contains("on")) { c.classList.add("on"); rustle(); return; }
    const t = TOOL[c.dataset.k]; let ex = esc(t.ex); t.mark.forEach(m => ex = ex.split(esc(m)).join(`<mark>${esc(m)}</mark>`));
    modal(`<div class="kick">${esc(t.who)}</div><h2 style="color:${t.ink}">${t.ic} ${esc(t.n)}</h2><div class="rule"></div><p><b>Анықтама.</b> ${esc(t.d)}</p><div class="excerpt">${ex}</div><p><b>Автор неге қолданды?</b> ${esc(t.why)}</p>`); }); },
  detective() { const L = D.detective; let i = 0, res = [];
    const show = () => { const x = L[i]; $("#dWho").textContent = x.who; $("#dTxt").textContent = x.t; $("#dFb").innerHTML = ""; $("#dNext").style.display = "none";
      $$(".sealbtn").forEach(b => { b.className = "sealbtn"; b.disabled = false; }); $("#dDots").innerHTML = L.map((_, k) => `<i class="${res[k] === 1 ? "ok" : res[k] === 0 ? "no" : ""} ${k === i ? "cur" : ""}"></i>`).join(""); };
    $$(".sealbtn").forEach(b => b.onclick = () => { const x = L[i], ok = b.dataset.k === x.a || (x.a === "par" && b.dataset.k === "par");
      if (res[i] == null) res[i] = ok ? 1 : 0; if (ok) { b.classList.add("ok"); chime(true); const t = TOOL[x.a] && !TOOL[x.a].hidden ? TOOL[x.a] : TOOL.par;
        const why = (D.tools.find(z => z.ex.replace(/\n/g, " ").includes(x.t.slice(0, 18))) || t).why; $("#dFb").innerHTML = `✅ <b>${esc(t.n)}.</b> ${esc(why)}`; $("#dNext").style.display = i < L.length - 1 ? "" : "none";
        if (i === L.length - 1) $("#dFb").innerHTML += `<br><b>🏁 Тергеу аяқталды: ${res.filter(v => v === 1).length} / ${L.length}</b>`; }
      else { b.classList.add("no"); b.disabled = true; chime(false); $("#dFb").textContent = "Жоқ, мұқият оқы: сөздер қалай байланысқан?"; }
      $("#dDots").innerHTML = L.map((_, k) => `<i class="${res[k] === 1 ? "ok" : res[k] === 0 ? "no" : ""} ${k === i ? "cur" : ""}"></i>`).join(""); });
    $("#dNext").onclick = () => { i++; rustle(); show(); }; show(); },
  passport() { $$(".au").forEach(b => b.onclick = () => { $$(".au").forEach(x => x.classList.toggle("on", x === b)); const a = D.authors[+b.dataset.i], g = D.groups[a.g];
    $("#ppBox").innerHTML = `${kick("Стиль паспорты №" + (+b.dataset.i + 1))}<div class="passport"><h3>${esc(a.n)}<small>${esc(a.w)} · ${esc(a.era)}</small></h3>
      <p class="small muted" style="margin:8px 0 2px">1. Қандай құралдар? (мөрді бас)</p><div class="stamps">${MAIN.map(t => `<button class="stamp" data-k="${t.k}" style="--sc:${t.ink}">${t.ic} ${esc(t.n)}</button>`).join("")}</div>
      <p class="small muted" style="margin:8px 0 2px">2. Стиль ерекшелігі</p><ul class="traits" id="tr">${a.style.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <p class="small muted" style="margin:10px 0 2px">3. Пафосы</p><span class="pafos-tag" id="pf">${esc(a.pafos)}</span>
      <div style="display:flex;gap:10px;margin-top:14px"><button class="btn gold" id="ppShow">Паспортты ашу</button><span class="gpill" style="--gc:${g.c}">${g.i} ${esc(g.n)}</span></div></div>`;
    $$(".stamp", $("#ppBox")).forEach(s => s.onclick = () => { if (a.tools.includes(s.dataset.k)) { s.classList.add("ok"); chime(true); } else { s.classList.remove("no"); void s.offsetWidth; s.classList.add("no"); chime(false); } });
    $("#ppShow").onclick = () => { $("#tr").classList.add("show"); $("#pf").classList.add("show"); $$(".stamp", $("#ppBox")).forEach(s => a.tools.includes(s.dataset.k) && s.classList.add("ok")); chime(true); }; rustle(); }); },
  scale() { $$(".mr").forEach(m => m.onclick = () => { m.classList.toggle("on"); rustle(); });
    let sel = null, placed = 0; const tilt = () => { const n = $$(".pan .wchip.in").length; $("#beam").style.transform = `rotate(${n === D.works.length ? 0 : (n % 2 ? -6 : 4)}deg)`; };
    $$("#wl .wchip").forEach(w => w.onclick = () => { $$("#wl .wchip").forEach(x => x.classList.remove("sel")); sel = w; w.classList.add("sel"); });
    $$(".pan").forEach(p => p.onclick = () => { if (!sel) return; const w = D.works[+sel.dataset.i];
      if (w.a === p.dataset.k) { const c = document.createElement("span"); c.className = "wchip in"; c.textContent = w.n.split(" · ")[1] || w.n; $(".bowl", p).appendChild(c); sel.remove(); sel = null; placed++; chime(true);
        $("#sFb").innerHTML = `<b>Идеясы:</b> ${esc(w.idea)}<br><b>Ұлттық мүдде:</b> ${esc(w.nat)}`; tilt();
        if (placed === D.works.length) { $("#crown").classList.add("glow"); $("#crown").textContent = "👑"; $("#sFb").innerHTML += "<br>⚖️ <b>Таразы теңелді: әр шығарма — ұлт мүддесінің бір қыры.</b>"; } }
      else { p.animate([{ transform: "translateY(0)" }, { transform: "translateY(10px)" }, { transform: "translateY(0)" }], { duration: 400 }); chime(false); $("#sFb").textContent = "Ойлан: бұл шығарманың рухы қандай — ерлік пе, ой ма, күлкі ме?"; } });
    tilt(); },
  quiz() { let i = 0, shown = false; const draw = () => { const q = D.quiz[i], st = qStats(i);
      $("#qDots").innerHTML = D.quiz.map((_, k) => `<i class="${k < i ? "ok" : ""} ${k === i ? "cur" : ""}"></i>`).join(""); $("#qQ").textContent = `${i + 1}. ${q.q}`;
      $("#qO").innerHTML = q.o.map((o, k) => `<div class="qo ${shown && k === q.a ? "ok" : ""}"><i>${"АӘБВ"[k]}</i>${esc(o)}<span class="bar">${st.n ? Math.round(st.c[k] / st.n * 100) + "%" : ""}</span></div>`).join(""); };
    $("#qShow").onclick = () => { shown = true; chime(true); draw(); }; $("#qNext").onclick = () => { if (i < D.quiz.length - 1) { i++; shown = false; rustle(); draw(); } }; $("#qPrev").onclick = () => { if (i > 0) { i--; shown = false; draw(); } };
    draw(); drawLB(); BIND._qdraw = draw; },
  final() { drawRefl(); }
};
const qStats = i => { const c = [0, 0, 0, 0]; let n = 0; Object.values(CLOUD.ans || {}).forEach(a => { const v = a && a[i]; if (v != null && v >= 0) { c[v]++; n++; } }); return { c, n }; };
function drawJoin() { const p = Object.values(CLOUD.players || {}); D.groups.forEach((_, i) => { const el = $("#gc" + i); if (el) el.textContent = p.filter(x => x.g === i).length; }); }
function drawLB() { const b = $("#lb"); if (!b) return; const pl = CLOUD.players || {}, an = CLOUD.ans || {};
  const sc = D.groups.map((_, g) => { const ids = Object.keys(pl).filter(id => pl[id].g === g); if (!ids.length) return 0; const tot = ids.reduce((s, id) => s + D.quiz.reduce((t, q, k) => t + ((an[id] || [])[k] === q.a ? 1 : 0), 0), 0); return Math.round(tot / ids.length / D.quiz.length * 100); });
  b.innerHTML = D.groups.map((g, i) => `<div class="lbr"><span>${g.i} ${esc(g.n)}</span><div class="t"><i style="width:${sc[i]}%;background:${g.c}"></i></div><span>${sc[i]}%</span></div>`).join(""); }
function drawRefl() { const b = $("#rfl"); if (!b) return; const c = [0, 0, 0]; Object.values(CLOUD.refl || {}).forEach(v => c[v] = (c[v] || 0) + 1); const mx = Math.max(1, ...c);
  b.innerHTML = D.reflect.map((r, i) => `<div class="rbar"><span>${r}</span><div class="t"><i style="width:${c[i] / mx * 100}%"></i></div><b>${c[i]}</b></div>`).join(""); }
async function pull() { try { CLOUD = (await CL.get("")) || {}; drawJoin(); drawLB(); drawRefl(); if (BIND._qdraw && $("#qQ")) BIND._qdraw(); } catch {} }

/* ---------- оқушы телефоны ---------- */
function stu() {
  document.body.classList.add("stu"); const id = LS.get("id", null) || (Math.random().toString(36).slice(2, 10)); LS.set("id", id);
  const g = LS.get("g", null), ans = LS.get("ans", []);
  const root = $("#root");
  if (g == null) { root.innerHTML = `<div class="phone"><div class="pg">${ORNS}<div class="content">${kick("Сөз сарайының кілті")}<h2>Тобыңды таңда</h2><input id="nm" placeholder="Атың" style="width:100%;margin:12px 0;padding:12px;border-radius:10px;border:2px solid #CDB487;font:inherit">
    <div class="tpick">${D.groups.map((x, i) => `<button data-g="${i}" style="--gc:${x.c}">${x.i} ${esc(x.n)}</button>`).join("")}</div></div></div></div>`;
    $$(".tpick button").forEach(b => b.onclick = () => { const nm = $("#nm").value.trim() || "Оқушы"; LS.set("g", +b.dataset.g); LS.set("nm", nm); CL.put(`players/${id}`, { g: +b.dataset.g, n: nm }).catch(() => {}); stu(); }); return; }
  let i = ans.length; const q = D.quiz[i], gr = D.groups[g];
  root.innerHTML = `<div class="phone"><div class="pg">${ORNS}<div class="content">${kick(gr.i + " " + gr.n)}${i < D.quiz.length ? `<div class="dots">${D.quiz.map((_, k) => `<i class="${k < i ? "ok" : ""} ${k === i ? "cur" : ""}"></i>`).join("")}</div>
    <h3 style="font-size:26px">${i + 1}. ${esc(q.q)}</h3><div class="quiz-o">${q.o.map((o, k) => `<button class="qo" data-k="${k}"><i>${"АӘБВ"[k]}</i>${esc(o)}</button>`).join("")}</div>`
    : `<h2>Сынақ аяқталды!</h2><p style="font:italic 500 26px var(--hf)">Нәтижең: ${ans.filter((a, k) => a === D.quiz[k].a).length} / ${D.quiz.length}</p><div class="rule"></div><h3>Қауырсын қалам · рефлексия</h3>
    <div class="quiz-o">${D.reflect.map((r, k) => `<button class="qo ${LS.get("refl", -1) === k ? "ok" : ""}" data-r="${k}">${r}</button>`).join("")}</div><p class="small muted" id="rmsg"></p>`}</div></div></div>`;
  $$(".qo[data-k]").forEach(b => b.onclick = () => { const k = +b.dataset.k, ok = k === q.a; b.classList.add(ok ? "ok" : ""); if (!ok) { b.style.background = "#9B2C2C"; b.style.color = "#fff"; $$(".qo")[q.a].classList.add("ok"); }
    chime(ok); ans.push(k); LS.set("ans", ans); CL.put(`ans/${id}/${i}`, k).catch(() => {}); setTimeout(stu, 1100); });
  $$(".qo[data-r]").forEach(b => b.onclick = () => { LS.set("refl", +b.dataset.r); CL.put(`refl/${id}`, +b.dataset.r).catch(() => {}); $$(".qo[data-r]").forEach(x => x.classList.toggle("ok", x === b)); $("#rmsg").textContent = "Рахмет! Жауабың тақтаға жетті."; });
}

if (MODE === "stu") stu(); else { board(); if (CL.ok) { pull(); setInterval(pull, 3000); } }
})();

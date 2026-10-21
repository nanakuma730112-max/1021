'use strict';
const $ = i => document.getElementById(i), PI = Math.PI, TAU = 2 * PI;
const ID = { a: 1, b: 1, c: 0, d: 0 };
const HUE = { sin: 210, cos: 140, tan: 25 };
const init = () => ({ tab: 1, fn: 'sin', th: 0.6, play: false, speed: 1, unit: 'deg',
  ...ID, base: { ...ID }, showBase: true, xmin: -PI, span: 6 * PI });
let S = init(), drag = false, A, B, R = 100, side = true;
const cc = $('cc'), cg = $('cg');

/* ---------- helpers ---------- */
const fmt = (n, k = 2) => String(+n.toFixed(k));
const gcd = (x, y) => y ? gcd(y, x % y) : x;
function piStr(r) {               // radians -> π表記 (π/12 刻み)
  const n = Math.round(r / (PI / 12));
  if (Math.abs(r - n * PI / 12) > 1e-6) return fmt(r / PI) + 'π';
  if (!n) return '0';
  const g = gcd(Math.abs(n), 12), p = n / g, q = 12 / g;
  return (p === 1 ? '' : p === -1 ? '−' : p) + 'π' + (q === 1 ? '' : '/' + q);
}
const angStr = r => S.unit === 'deg' ? fmt(r * 180 / PI, 1) + '°' : piStr(r);
const halfPi = t => {
  if (!t) return '0';
  if (t % 2 === 0) { const k = t / 2; return k === 1 ? 'π' : k === -1 ? '−π' : String(k).replace('-', '−') + 'π'; }
  const n = Math.abs(t); return (t < 0 ? '−' : '') + (n === 1 ? '' : n) + 'π/2';
};
const F = x => S.fn === 'sin' ? Math.sin(x) : S.fn === 'cos' ? Math.cos(x) : Math.tan(x);
const G = (p, x) => p.a * F(p.b * (x - p.c)) + p.d;
const line = (ctx, x1, y1, x2, y2, col, w, dash) => {
  ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
};
function formula(p) {
  const f = S.fn, c = p.c !== 0 ? 'θ ' + (p.c > 0 ? '− ' : '+ ') + angStr(Math.abs(p.c)) : 'θ';
  const arg = p.b === 1 ? c : (p.c ? fmt(p.b) + '(' + c + ')' : fmt(p.b) + 'θ');
  const a = p.a === 1 ? '' : p.a === -1 ? '−' : fmt(p.a);
  const d = p.d > 0 ? ' + ' + fmt(p.d) : p.d < 0 ? ' − ' + fmt(-p.d) : '';
  return 'y = ' + a + f + (arg === 'θ' ? ' θ' : '(' + arg + ')') + d;
}

/* ---------- layout ---------- */
function fit(cv) {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  return { ctx, w: r.width, h: r.height, top: r.top };
}
function layout() {
  A = fit(cc); B = fit(cg);
  const ym = S.tab === 1 ? 1.5 : 4.2;
  R = Math.min(A.h / 2 / ym, A.w / 2.6);
  side = Math.abs(A.top - B.top) < 2;
}
new ResizeObserver(layout).observe(cc); new ResizeObserver(layout).observe(cg);

/* ---------- unit circle ---------- */
function drawCircle() {
  const { ctx, w, h } = A, cx = w / 2, cy = h / 2, th = S.th, col = `hsl(${HUE[S.fn]},80%,33%)`;
  ctx.clearRect(0, 0, w, h);
  line(ctx, 0, cy, w, cy, '#8a93a6', 1.5); line(ctx, cx, 0, cx, h, '#8a93a6', 1.5);
  ctx.beginPath(); ctx.strokeStyle = '#14213d'; ctx.lineWidth = 2.5; ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  const co = Math.cos(th), si = Math.sin(th), px = cx + R * co, py = cy - R * si;
  const tm = ((th % TAU) + TAU) % TAU;
  ctx.beginPath(); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.arc(cx, cy, R * 0.28, 0, -tm, true); ctx.stroke();
  let lvl, sx0, sy0;
  if (S.fn === 'sin') { line(ctx, px, cy, px, py, col, 5); lvl = py; sx0 = px; sy0 = py; }
  else if (S.fn === 'cos') {
    line(ctx, cx, cy, px, cy, col, 5); lvl = cy - R * co; sx0 = cx; sy0 = lvl;
    line(ctx, px, cy, cx, lvl, col, 1.5, [5, 5]);
    ctx.beginPath(); ctx.fillStyle = col; ctx.arc(cx, lvl, 6, 0, TAU); ctx.fill();
  } else {
    const t = Math.max(-1e4, Math.min(1e4, Math.tan(th))), ty = cy - R * t;
    line(ctx, cx + R, 0, cx + R, h, '#8a93a6', 1.5, [4, 4]);
    line(ctx, cx, cy, cx + R, ty, '#14213d', 1.5, [6, 5]);
    line(ctx, cx + R, cy, cx + R, ty, col, 5); lvl = ty; sx0 = cx + R; sy0 = ty;
  }
  line(ctx, cx, cy, px, py, '#14213d', 2.5);
  if (side && lvl > 0 && lvl < h) line(ctx, sx0, sy0, w, lvl, col, 1.5, [6, 5]);
  ctx.beginPath(); ctx.fillStyle = '#d62839'; ctx.arc(px, py, 10, 0, TAU); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#c0392b';
  ctx.fillText('θ', cx + R * 0.34, cy - 6);
  ctx.fillStyle = '#14213d'; ctx.font = '14px sans-serif';
  ctx.fillText('x', w - 16, cy - 6); ctx.fillText('y', cx + 8, 16);
}

/* ---------- graph ---------- */
function curve(ctx, p, sx, h, col, wd, dash) {
  ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.setLineDash(dash || []);
  const tan = S.fn === 'tan'; let pk = null, pen = false;
  for (let px = 0; px <= B.w; px++) {
    const x = S.xmin + px / sx, k = tan ? Math.floor((p.b * (x - p.c) + PI / 2) / PI) : 0;
    const y = h / 2 - R * G(p, x);
    if (!isFinite(y) || Math.abs(y - h / 2) > 1e4) { pen = false; pk = k; continue; }
    if (tan && k !== pk) pen = false;
    pk = k;
    if (!pen) { ctx.moveTo(px, y); pen = true; } else ctx.lineTo(px, y);
  }
  ctx.stroke(); ctx.setLineDash([]);
}
function asymptotes(ctx, p, sx, h, col) {
  const f1 = p.b * (S.xmin - p.c), f2 = p.b * (S.xmin + S.span - p.c);
  for (let k = Math.ceil((f1 - PI / 2) / PI); k <= Math.floor((f2 - PI / 2) / PI); k++) {
    const x = (p.c + (PI / 2 + k * PI) / p.b - S.xmin) * sx;
    line(ctx, x, 0, x, h, col, 1.8, [2, 5]);
  }
}
function drawGraph() {
  const { ctx, w, h } = B, sx = w / S.span, cy = h / 2, X = x => (x - S.xmin) * sx, Y = v => cy - R * v;
  const hue = HUE[S.fn], dark = `hsl(${hue},80%,33%)`, light = `hsl(${hue},55%,68%)`;
  ctx.clearRect(0, 0, w, h); ctx.font = '15px sans-serif';
  let m = 1; while (sx * PI / 2 * m < 80) m *= 2;
  const u = PI / 2 * m;
  for (let i = Math.ceil(S.xmin / u); i * u <= S.xmin + S.span; i++) {
    const x = X(i * u);
    line(ctx, x, 0, x, h, i ? '#e1e5ee' : '#14213d', i ? 1 : 2.5);
    if (i) { ctx.fillStyle = '#14213d'; ctx.textAlign = 'center';
      ctx.fillText(S.unit === 'deg' ? fmt(i * m * 90, 0) + '°' : halfPi(i * m), x, cy + 20); }
  }
  ctx.textAlign = 'left';
  for (let v = -Math.floor(cy / R); v <= Math.floor(cy / R); v++) {
    line(ctx, 0, Y(v), w, Y(v), v ? '#e1e5ee' : '#14213d', v ? 1 : 2.5);
    if (v) { ctx.fillStyle = '#14213d'; ctx.fillText(String(v).replace('-', '−'), 6, Y(v) - 4); }
  }
  const p = S.tab === 1 ? ID : S, bp = S.base, showB = S.tab === 2 && S.showBase;
  if (S.fn === 'tan') {
    if (showB) asymptotes(ctx, bp, sx, h, light);
    asymptotes(ctx, p, sx, h, dark);
  }
  if (showB) curve(ctx, bp, sx, h, light, 4, [10, 7]);
  curve(ctx, p, sx, h, dark, 4.5);

  const th = S.th, tx = X(th), tv = Math.max(-1e4, Math.min(1e4, G(p, th))), ty = Y(tv);
  const idv = Y(Math.max(-1e4, Math.min(1e4, F(th))));
  if (side && idv > 0 && idv < h) line(ctx, 0, idv, Math.min(Math.max(tx, 0), w), idv, dark, 1.5, [6, 5]);
  if (tx >= 0 && tx <= w) {
    line(ctx, tx, cy, tx, ty, dark, 1.5, [4, 4]);
    if (S.tab === 2) {
      ctx.beginPath(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; ctx.arc(tx, idv, 6, 0, TAU); ctx.stroke();
      if (showB) { ctx.beginPath(); ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.arc(tx, Y(G(bp, th)), 8, 0, TAU); ctx.stroke(); }
    }
    ctx.beginPath(); ctx.fillStyle = dark; ctx.arc(tx, ty, 9, 0, TAU); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
  // 凡例
  const rows = S.tab === 2 && showB
    ? [['変化前 ' + formula(bp), light, [10, 7], 4], ['変化後 ' + formula(S), dark, [], 4.5]]
    : [[formula(p), dark, [], 4.5]];
  ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'left';
  const lw = Math.max(...rows.map(r => ctx.measureText(r[0]).width)) + 64;
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(w - lw - 12, 8, lw, rows.length * 28 + 10);
  rows.forEach((r, i) => {
    const y = 28 + i * 28;
    line(ctx, w - lw - 4, y - 5, w - lw + 34, y - 5, r[1], r[3], r[2]);
    ctx.fillStyle = '#14213d'; ctx.fillText(r[0], w - lw + 42, y);
  });
}

/* ---------- info panel ---------- */
let lastInfo = '';
function drawInfo() {
  const th = S.th, deg = th * 180 / PI, co = Math.cos(th);
  const ang = S.unit === 'deg' ? `${fmt(deg, 1)}°（${fmt(th, 3)} rad）` : `${fmt(th, 3)} rad（${fmt(th / PI, 3)}π ／ ${fmt(deg, 1)}°）`;
  const tn = Math.abs(co) < 1e-6 ? '定義されない' : fmt(Math.tan(th), 3);
  const g = Math.abs(S.fn === 'tan' ? co : 1) < 1e-6 ? '' : '';
  let h = `<div class="f">${formula(S.tab === 1 ? ID : S)}</div>`
    + `<span>角 θ = <b>${ang}</b></span>`
    + `<span>点 P(<b>${fmt(co, 3)}</b>, <b>${fmt(Math.sin(th), 3)}</b>)</span>`
    + `<span>sin θ = <b>${fmt(Math.sin(th), 3)}</b></span><span>cos θ = <b>${fmt(co, 3)}</b></span><span>tan θ = <b>${tn}</b></span>`;
  if (S.tab === 2) {
    const per = (S.fn === 'tan' ? PI : TAU) / S.b, pn = S.fn === 'tan' ? 'π' : '2π';
    const gv = G(S, th), gs = S.fn === 'tan' && Math.abs(Math.cos(S.b * (th - S.c))) < 1e-6 ? '定義されない' : fmt(gv, 3);
    h += `<span>周期 = ${pn}/|b| = <b>${S.unit === 'deg' ? fmt(per * 180 / PI, 1) + '°' : fmt(per / PI, 3) + 'π'}</b></span>`
      + `<span>横：<b>${S.c > 0 ? '右へ ' + angStr(S.c) : S.c < 0 ? '左へ ' + angStr(-S.c) : '移動なし'}</b></span>`
      + `<span>縦：<b>${S.d > 0 ? '上へ ' + fmt(S.d) : S.d < 0 ? '下へ ' + fmt(-S.d) : '移動なし'}</b></span>`
      + `<span>この式の値 y = <b>${gs}</b></span>`;
  }
  if (h !== lastInfo) { $('info').innerHTML = h; lastInfo = h; }
}

/* ---------- animation ---------- */
function follow() {
  const lo = S.xmin + 0.05 * S.span, hi = S.xmin + 0.95 * S.span;
  if (S.th > hi) S.xmin += S.th - hi; else if (S.th < lo) S.xmin -= lo - S.th;
}
let last = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.1); last = t;
  if (S.play && !drag) { S.th += S.speed * dt; follow(); }
  if (A && B) { drawCircle(); drawGraph(); drawInfo(); }
  requestAnimationFrame(loop);
}

/* ---------- UI ---------- */
function outs() {
  $('oa').textContent = fmt(S.a); $('ob').textContent = fmt(S.b);
  $('oc').textContent = S.c ? (S.c > 0 ? '右 ' : '左 ') + angStr(Math.abs(S.c)) : '0';
  $('od').textContent = S.d ? (S.d > 0 ? '上 ' : '下 ') + fmt(Math.abs(S.d)) : '0';
  $('la').textContent = S.fn === 'tan' ? '縦倍率 a' : '振幅 a';
}
function sync() {
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', +b.dataset.tab === S.tab));
  document.querySelectorAll('[data-fn]').forEach(b => b.classList.toggle('on', b.dataset.fn === S.fn));
  document.querySelectorAll('[data-unit]').forEach(b => b.classList.toggle('on', b.dataset.unit === S.unit));
  $('t2').hidden = S.tab !== 2;
  $('play').textContent = S.play ? '⏸ 一時停止' : '▶ 再生';
  $('a').value = S.a; $('b').value = S.b; $('c').value = Math.round(S.c * 180 / PI); $('d').value = S.d;
  $('sb').checked = S.showBase; $('speed').value = S.speed;
  const t = S.tab === 1;
  $('back').textContent = S.unit === 'deg' ? '◀ 15°' : '◀ π/12';
  $('fwd').textContent = S.unit === 'deg' ? '15° ▶' : 'π/12 ▶';
  outs(); lastInfo = ''; setTimeout(layout, 0);
}
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = +b.dataset.tab; sync(); });
document.querySelectorAll('[data-fn]').forEach(b => b.onclick = () => { S.fn = b.dataset.fn; S.base = { ...ID }; sync(); });
document.querySelectorAll('[data-unit]').forEach(b => b.onclick = () => { S.unit = b.dataset.unit; sync(); });
$('reset').onclick = () => { S = init(); sync(); };
$('play').onclick = () => { S.play = !S.play; sync(); };
$('back').onclick = () => { S.th -= PI / 12; follow(); };
$('fwd').onclick = () => { S.th += PI / 12; follow(); };
$('speed').onchange = e => { S.speed = +e.target.value; };
const zoom = (f, cx = 0.5) => {
  const ns = Math.min(40 * PI, Math.max(PI / 2, S.span * f)), at = S.xmin + cx * S.span;
  S.xmin = at - cx * ns; S.span = ns;
};
$('zi').onclick = () => zoom(0.75); $('zo').onclick = () => zoom(1 / 0.75);
$('zr').onclick = () => { S.xmin = -PI; S.span = 6 * PI; };
['a', 'b', 'c', 'd'].forEach(k => $(k).oninput = e => {
  S[k] = k === 'c' ? e.target.value * PI / 180 : +e.target.value; outs();
});
$('sb').onchange = e => { S.showBase = e.target.checked; };
$('nb').onclick = () => { S.base = { a: S.a, b: S.b, c: S.c, d: S.d }; S.showBase = true; sync(); };
$('ro').onclick = () => { S.showBase = false; sync(); };

/* 単位円のドラッグ（何周でも） */
function setFromPtr(e) {
  const r = cc.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = r.height / 2 - (e.clientY - r.top);
  if (!x && !y) return;
  const cur = ((S.th % TAU) + TAU) % TAU;
  let d = Math.atan2(y, x) - cur; d = (((d + PI) % TAU) + TAU) % TAU - PI;
  S.th += d; follow();
}
cc.onpointerdown = e => { drag = true; cc.setPointerCapture(e.pointerId); cc.style.cursor = 'grabbing'; setFromPtr(e); };
cc.onpointermove = e => { if (drag) setFromPtr(e); };
cc.onpointerup = cc.onpointercancel = () => { drag = false; cc.style.cursor = ''; };

/* グラフの移動・拡大縮小 */
let pan = null;
cg.onpointerdown = e => { pan = e.clientX; cg.setPointerCapture(e.pointerId); };
cg.onpointermove = e => { if (pan !== null) { S.xmin -= (e.clientX - pan) * S.span / B.w; pan = e.clientX; } };
cg.onpointerup = cg.onpointercancel = () => { pan = null; };
cg.addEventListener('wheel', e => {
  e.preventDefault();
  zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, (e.clientX - cg.getBoundingClientRect().left) / B.w);
}, { passive: false });

sync();
requestAnimationFrame(loop);

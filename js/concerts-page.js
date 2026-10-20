// Page Concerts : dates triées automatiquement, compte à rebours, carte, traînées de phares,
// ajout au calendrier, réservation simulée, frise d'une soirée.
import { boot, onMotion, onCalm, onLang, state, t, tt, $, $$, split, sortedConcerts, fmtLong, fmtDate, countdown, renderMap, openModal, closeModal, announce, fineHover } from './core.js';
import { scenes } from '../data/concerts.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const mm = (q) => window.matchMedia(q).matches;

function coverPoint(box, iw, ih, u, v) {
  const w = box.clientWidth, h = box.clientHeight;
  const s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
  return [(w - dw) / 2 + u * dw, (h - dh) / 2 + v * dh];
}

/* ---------- Listes ---------- */
const mapsUrl = (c) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.venue} ${c.city} ${c.country}`)}`;
function gigHTML(c, i, past) {
  const cancel = c.status === 'annule';
  const day = fmtDate(c.at, { day: '2-digit' }), mon = fmtDate(c.at, { month: 'short' }).replace('.', ''), yr = fmtDate(c.at, { year: 'numeric' });
  const acts = past || cancel ? '' : `<div class="gig__acts">
      <button type="button" class="chip" data-ics="${i}">${t('Ajouter au calendrier', 'Add to calendar')}</button>
      <a class="chip" href="${mapsUrl(c)}" target="_blank" rel="noopener">${t('Itinéraire', 'Directions')}</a>
      ${c.booking ? `<a class="chip" href="${c.booking}" target="_blank" rel="noopener">${t('Réserver auprès du lieu', 'Book with the venue')}</a>` : `<button type="button" class="chip" data-book="${i}">${t('Réserver une place (démo)', 'Reserve a seat (demo)')}</button>`}
    </div>`;
  return `<li class="gig${past ? ' is-past' : ''}${cancel ? ' is-cancel' : ''}" data-date="${c.date}">
    <div class="gig__d" aria-hidden="true"><b>${day}</b><span>${mon}</span><span>${yr}</span></div>
    <div>
      <h3 class="gig__city">${c.city} <small>(${c.dept})</small></h3>
      <p class="gig__meta">${c.venue}${c.time && !cancel ? ` · ${c.time.replace(':', state.lang === 'en' ? ':' : ' h ')}` : ''}<span class="sr">, ${fmtLong(c)}</span></p>
      ${c.note && !past ? `<span class="gig__note">${tt(c.note)}</span>` : ''}
      ${acts}
    </div>
    ${cancel ? `<span class="stamp">${t('Annulé', 'Canceled')}</span>` : ''}
  </li>`;
}
let list = [];
function render() {
  const { all, upcoming, past, next } = sortedConcerts();
  list = all;
  const idx = (c) => all.indexOf(c);
  $('#upList').innerHTML = upcoming.length ? upcoming.map((c) => gigHTML(c, idx(c), false)).join('') : `<li class="gig"><p>${t('Pas de date annoncée pour le moment. Revenez bientôt.', 'No dates announced yet. Check back soon.')}</p></li>`;
  $('#pastList').innerHTML = past.map((c) => gigHTML(c, idx(c), true)).join('');
  $('#venues').innerHTML = scenes.map((s) => `<li><b>${s.name}</b><span>${s.city}${s.year ? ' · ' + s.year : ''}</span></li>`).join('');
  const box = $('#cNext');
  if (next) {
    box.querySelector('[data-next="city"]').textContent = next.city;
    box.querySelector('[data-next="venue"]').textContent = next.venue;
    box.querySelector('[data-next="when"]').textContent = fmtLong(next);
    if (!render.timer) render.timer = countdown(box.querySelector('[data-countdown]'), next.at.getTime());
  } else box.hidden = true;
  $$('[data-map="big"]').forEach((m) => renderMap(m, { big: true }));
  linkHover();
}
function linkHover() {
  $$('.gig[data-date]').forEach((li) => {
    const on = (v) => {
      $$(`.map__pt[data-date="${li.dataset.date}"]`).forEach((p) => p.classList.toggle('is-on', v));
      li.classList.toggle('is-on', v);
    };
    li.addEventListener('pointerenter', () => on(true)); li.addEventListener('pointerleave', () => on(false));
    li.addEventListener('focusin', () => on(true)); li.addEventListener('focusout', () => on(false));
  });
}

/* ---------- Calendrier (.ics) ---------- */
const icsDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function downloadIcs(c) {
  const end = new Date(c.at.getTime() + 2 * 3600e3);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Will//Concerts//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:will-${c.date}-${c.city.replace(/\W/g, '')}@will-maquette`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(c.at)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:Will en concert – ${c.venue}`, `LOCATION:${c.venue}, ${c.city} (${c.dept}), ${c.country}`,
    'DESCRIPTION:Country rock. Infos : will (maquette)', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `will-${c.date}-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  announce(t('Fichier de calendrier téléchargé.', 'Calendar file downloaded.'));
}

/* ---------- Réservation simulée ---------- */
function book(c) {
  openModal(`<h2 id="modalTitle">${t('Réserver une place', 'Reserve a seat')}</h2>
    <p><b>${c.city}</b>, ${c.venue}<br>${fmtLong(c)}</p>
    <p class="demo">${t('Démonstration : aucune réservation n’est envoyée. Les vraies informations de billetterie sont à compléter pour cette date.', 'Demo: no reservation is sent. Real ticketing details for this date are still to be added.')}</p>
    <form id="bookForm" novalidate>
      <div class="field"><label for="bkN">${t('Nombre de places', 'Seats')}</label><input id="bkN" type="number" min="1" max="10" value="2" inputmode="numeric"></div>
      <div class="field"><label for="bkName">${t('Nom', 'Name')}</label><input id="bkName" type="text" autocomplete="name" required></div>
      <div class="field"><label for="bkMail">${t('E-mail', 'Email')}</label><input id="bkMail" type="email" autocomplete="email" required></div>
      <p class="wiz__err" id="bkErr" role="alert"></p>
      <button type="submit" class="btn btn--fire">${t('Réserver (démo)', 'Reserve (demo)')}</button>
    </form>`, (body) => {
    body.querySelector('#bookForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = body.querySelector('#bkName').value.trim(), mail = body.querySelector('#bkMail').value.trim(), n = Number(body.querySelector('#bkN').value);
      const err = body.querySelector('#bkErr');
      if (!name) { err.textContent = t('Indiquez votre nom.', 'Enter your name.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { err.textContent = t('Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.', 'Enter a valid email address, for example name@example.com.'); return; }
      if (!(n >= 1 && n <= 10)) { err.textContent = t('Choisissez entre 1 et 10 places.', 'Choose between 1 and 10 seats.'); return; }
      body.innerHTML = `<h2 id="modalTitle">${t('Place réservée (démo)', 'Seat reserved (demo)')}</h2><p>${t(`${n} place${n > 1 ? 's' : ''} pour ${c.city}, le ${fmtLong(c)}.`, `${n} seat${n > 1 ? 's' : ''} for ${c.city}, ${fmtLong(c)}.`)}</p><p class="demo">${t('Rien n’a été envoyé : c’est une maquette.', 'Nothing was sent: this is a mock-up.')}</p><button type="button" class="btn btn--ghost" data-close>${t('Fermer', 'Close')}</button>`;
      body.querySelector('[data-close]').focus();
    });
  });
}

/* ---------- Traînées de phares sur la route ---------- */
function roadPaths(mobile) {
  if (mobile) return {
    iw: 784, ih: 1168,
    red: [[-0.06, 0.885], [0.12, 0.81], [0.3, 0.745], [0.44, 0.69], [0.49, 0.655]],
    white: [[0.535, 0.655], [0.68, 0.685], [0.86, 0.725], [1.06, 0.765]],
  };
  const c = [[0.69, 1.03], [0.71, 0.88], [0.62, 0.8], [0.47, 0.745], [0.405, 0.69], [0.45, 0.655], [0.52, 0.632], [0.535, 0.59]];
  return { iw: 1168, ih: 784, center: c };
}
function catmull(pts, n = 220) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const steps = Math.ceil(n / (pts.length - 1));
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
class Trails {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.cars = []; this.on = false; this.last = 0; this.spawnT = 0;
    this.box = canvas.parentElement;
    this.resize = this.resize.bind(this); this.loop = this.loop.bind(this);
    new ResizeObserver(this.resize).observe(this.box); this.resize();
    this.io = new IntersectionObserver((e) => { this.vis = e[0].isIntersecting; if (this.vis && this.on) requestAnimationFrame(this.loop); }); this.io.observe(canvas);
  }
  resize() {
    const w = this.box.clientWidth, h = this.box.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = w; this.h = h; this.c.width = w * dpr; this.c.height = h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = mm('(max-aspect-ratio: 4/5)');
    const R = roadPaths(mobile);
    const toPx = (p) => coverPoint(this.box, R.iw, R.ih, p[0], p[1]);
    const lanes = [];
    if (mobile) {
      lanes.push({ pts: catmull(R.red).map(toPx), color: [255, 60, 40], dir: 1 });
      lanes.push({ pts: catmull(R.white).map(toPx), color: [255, 236, 200], dir: -1 });
    } else {
      const cen = catmull(R.center).map(toPx);
      const off = (k) => cen.map((p, i) => {
        const a = cen[Math.max(0, i - 1)], b = cen[Math.min(cen.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; const persp = 1 - i / cen.length;
        const wv = (3 + persp * 22) * k; return [p[0] - (dy / L) * wv, p[1] + (dx / L) * wv];
      });
      lanes.push({ pts: off(-1), color: [255, 60, 40], dir: -1 });
      lanes.push({ pts: off(1), color: [255, 236, 200], dir: 1 });
    }
    lanes.forEach((l) => { l.len = [0]; for (let i = 1; i < l.pts.length; i++) l.len.push(l.len[i - 1] + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1])); l.total = l.len[l.len.length - 1]; });
    this.lanes = lanes;
  }
  at(l, s) { const d = s * l.total; let i = 1; while (i < l.len.length - 1 && l.len[i] < d) i++; const k = (d - l.len[i - 1]) / ((l.len[i] - l.len[i - 1]) || 1); const a = l.pts[i - 1], b = l.pts[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, i / l.pts.length]; }
  start() { if (this.on) return; this.on = true; this.last = performance.now(); requestAnimationFrame(this.loop); }
  stop() { this.on = false; this.ctx.clearRect(0, 0, this.w, this.h); }
  loop(now) {
    if (!this.on || !this.vis) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.cars.length < 6) { this.spawnT = 0.7 + Math.random() * 1.3; this.cars.push({ lane: this.lanes[Math.random() < 0.5 ? 0 : 1], s: 0, v: 0.22 + Math.random() * 0.16, len: 0.12 + Math.random() * 0.08 }); }
    const c = this.ctx; c.clearRect(0, 0, this.w, this.h); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    this.cars = this.cars.filter((car) => car.s < 1 + car.len);
    for (const car of this.cars) {
      car.s += car.v * dt;
      const l = car.lane, seg = 16;
      for (let k = 0; k < seg; k++) {
        let s0 = car.s - car.len * (k / seg), s1 = car.s - car.len * ((k + 1) / seg);
        if (l.dir < 0) { s0 = 1 - s0; s1 = 1 - s1; }
        if (s0 < 0 || s0 > 1 || s1 < 0 || s1 > 1) continue;
        const a = this.at(l, s0), b = this.at(l, s1);
        const near = l.dir > 0 ? 1 - a[2] : a[2];
        const alpha = (1 - k / seg) * (0.25 + 0.75 * Math.min(1, near * 1.4 + 0.15)) * 0.9;
        c.strokeStyle = `rgba(${l.color.join(',')},${alpha.toFixed(3)})`;
        c.lineWidth = 0.8 + near * 3.2;
        c.shadowColor = `rgba(${l.color.join(',')},0.9)`; c.shadowBlur = 10;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    }
    c.shadowBlur = 0; c.globalCompositeOperation = 'source-over';
    requestAnimationFrame(this.loop);
  }
}

/* ---------- Initialisation ---------- */
let trails;
boot(() => {
  render();
  onLang(() => { render(); ScrollTrigger && ScrollTrigger.refresh(); });
  document.addEventListener('click', (e) => {
    const ics = e.target.closest('[data-ics]'); if (ics) downloadIcs(list[Number(ics.dataset.ics)]);
    const bk = e.target.closest('[data-book]'); if (bk) book(list[Number(bk.dataset.book)]);
  });
  trails = new Trails($('#trails'));
  if (!state.calm) trails.start();
  onCalm((on) => (on ? trails.stop() : trails.start()));

  onMotion(() => {
    const cleanups = [];
    $$('[data-split]').forEach((el) => {
      const s = split(el, 'words'); if (!s) return;
      const hero = el.id === 'pTitle';
      gsap.from(s.words, { yPercent: 110, opacity: 0, rotate: 3, duration: hero ? 1.3 : 1.1, ease: 'power4.out', stagger: 0.06, delay: hero ? 0.2 : 0, scrollTrigger: hero ? undefined : { trigger: el, start: 'top 86%' } });
    });
    gsap.from('.phero__lead, .cnext', { y: 30, opacity: 0, duration: 1, stagger: 0.12, delay: 0.45, ease: 'power3.out' });
    gsap.fromTo('.phero__bg img', { scale: 1.14 }, { scale: 1, duration: 2.6, ease: 'power2.out' });
    gsap.to('.phero__bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
    if (fineHover) {
      const bx = gsap.quickTo('.phero__bg img', 'x', { duration: 1.4 }), by = gsap.quickTo('.phero__bg img', 'y', { duration: 1.4 });
      const mv = (e) => { bx((e.clientX / innerWidth - 0.5) * -20); by((e.clientY / innerHeight - 0.5) * -12); };
      window.addEventListener('pointermove', mv, { passive: true }); cleanups.push(() => window.removeEventListener('pointermove', mv));
    }
    gsap.from('#upList .gig', { x: -40, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '#upList', start: 'top 82%' } });
    gsap.from('.map--big', { y: 60, rotate: 4, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.map--big', start: 'top 85%' } });
    gsap.from('.map--big .map__pt', { scale: 0, transformOrigin: 'center', stagger: 0.1, duration: 0.7, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.map--big', start: 'top 70%' } });
    const road = $('.map--big .map__road');
    if (road) { const L = road.getTotalLength(); gsap.fromTo(road, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: '.map--big', start: 'top 70%' }, onComplete: () => { road.style.strokeDasharray = ''; } }); }
    $$('#pastList .stamp').forEach((st) => gsap.from(st, { scale: 2.6, opacity: 0, rotate: -24, duration: 0.5, ease: 'power4.in', scrollTrigger: { trigger: st, start: 'top 85%' } }));
    gsap.from('#pastList .gig, .venues li', { y: 24, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '#pastList', start: 'top 85%' } });
    gsap.from('.infos figure', { rotate: -8, y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.infos', start: 'top 75%' } });
    gsap.from('.qa dt, .qa dd', { y: 20, opacity: 0, stagger: 0.05, duration: 0.7, scrollTrigger: { trigger: '.qa', start: 'top 82%' } });

    // Frise d'une soirée : défilement horizontal piloté par le défilement vertical
    const rail = $('#evRail'), track = $('#evTrack');
    if (mm('(min-width: 900px)')) {
      track.style.overflow = 'visible';
      const dist = () => Math.max(0, rail.scrollWidth - innerWidth + 40);
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.evening', start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.4), pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 } });
      tl.to(rail, { x: () => -dist(), ease: 'none' }, 0).to('#evLine', { width: '100%', ease: 'none' }, 0);
      $$('.ev figure img').forEach((img) => gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.evening', start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.4), scrub: true } }));
      cleanups.push(() => { track.style.overflow = ''; });
    } else {
      gsap.from('.ev', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.evening', start: 'top 75%' } });
      const onS = () => { $('#evLine').style.width = (track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth)) * 100 + '%'; };
      track.addEventListener('scroll', onS, { passive: true }); cleanups.push(() => track.removeEventListener('scroll', onS));
    }
    gsap.fromTo('.pro__img img', { scale: 1.25, clipPath: 'inset(0 0 100% 0)' }, { scale: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: '.pro', start: 'top 70%' } });
    return () => cleanups.forEach((c) => c());
  });
});

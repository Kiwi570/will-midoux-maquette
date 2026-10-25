// Socle commun aux trois pages : langue, défilement fluide, mode calme, curseur,
// boutons magnétiques, en-tête, transitions de page, panier simulé, modales, dates.
import { EN } from './i18n.js';
import { products, SHOP_URL } from '../data/catalogue.js';
import { concerts } from '../data/concerts.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, window.SplitText);

const html = document.documentElement;
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
};
export const ses = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* */ } },
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const calmPref = store.get('will-calm');
export const state = {
  lang: store.get('will-lang') === 'en' ? 'en' : 'fr',
  calm: calmPref ? calmPref === '1' : reduced,
  webgl: !/[?&]nowebgl/.test(location.search),
};
export const t = (fr, en) => (state.lang === 'en' ? (en ?? fr) : fr);
export const tt = (o) => (o ? (o[state.lang] ?? o.fr) : '');
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- Langue ---------------- */
const langListeners = [];
export const onLang = (fn) => { langListeners.push(fn); };
function applyLang(lang, first = false) {
  state.lang = lang;
  html.lang = lang;
  store.set('will-lang', lang);
  revertSplits();
  $$('[data-i18n]').forEach((el) => {
    if (el.dataset.fr === undefined) el.dataset.fr = el.innerHTML;
    const k = el.dataset.i18n;
    el.innerHTML = lang === 'en' && EN[k] !== undefined ? EN[k] : el.dataset.fr;
  });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, k] = pair.split(':').map((s) => s.trim());
      const slot = 'fr' + attr.replace(/[^a-z]/gi, '');
      if (el.dataset[slot] === undefined) el.dataset[slot] = el.getAttribute(attr) || '';
      el.setAttribute(attr, lang === 'en' && EN[k] !== undefined ? EN[k] : el.dataset[slot]);
    });
  });
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const ttl = document.querySelector('meta[name="x-title-en"]');
  if (ttl) { if (!html.dataset.titleFr) html.dataset.titleFr = document.title; document.title = lang === 'en' ? ttl.content : html.dataset.titleFr; }
  if (!first) langListeners.forEach((fn) => fn(lang));
  if (!first && ScrollTrigger) ScrollTrigger.refresh();
}

/* ---------------- Découpe des titres (SplitText) ---------------- */
const splits = [];
export function split(el, type = 'words,chars') {
  if (!window.SplitText) return null;
  const s = new window.SplitText(el, { type, wordsClass: 'w', charsClass: 'c', aria: 'none' }); // texte lu tel quel
  splits.push(s);
  return s;
}
function revertSplits() { while (splits.length) { try { splits.pop().revert(); } catch (e) { /* */ } } }

/* ---------------- Mouvement : Lenis + contextes GSAP ---------------- */
let lenis = null;
let ctx = null;
const motionFns = [];
const calmListeners = [];
export const onMotion = (fn) => { motionFns.push(fn); };
export const onCalm = (fn) => { calmListeners.push(fn); };
export const getLenis = () => lenis;
const raf = (time) => { if (lenis) lenis.raf(time * 1000); };

function startLenis() {
  if (lenis || !window.Lenis) return;
  lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, anchors: false });
  lenis.on('scroll', () => ScrollTrigger && ScrollTrigger.update());
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}
function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}
function buildMotion() {
  if (!gsap) return;
  ctx = gsap.context(() => {
    const cleanups = [];
    motionFns.forEach((fn) => { try { const c = fn(); if (typeof c === 'function') cleanups.push(c); } catch (e) { console.error(e); } });
    return () => cleanups.forEach((c) => c());
  });
  ScrollTrigger.refresh();
}
function killMotion() { if (ctx) { ctx.revert(); ctx = null; } revertSplits(); }

export function setCalm(on, save = true) {
  const hdH = parseInt(getComputedStyle(html).getPropertyValue('--hd'), 10) || 72;
  const probe = document.elementFromPoint(innerWidth / 2, hdH + 20);
  const anchor = probe && (probe.closest('section, footer') || null);
  const before = anchor ? anchor.getBoundingClientRect().top : 0;
  state.calm = on;
  if (save) store.set('will-calm', on ? '1' : '0');
  html.classList.toggle('calm', on);
  html.classList.toggle('motion', !on);
  $$('#calmBtn').forEach((b) => b.setAttribute('aria-pressed', String(on)));
  if (on) { killMotion(); stopLenis(); html.classList.remove('has-cursor'); }
  else { startLenis(); buildMotion(); if (fineHover) html.classList.add('has-cursor'); }
  calmListeners.forEach((fn) => fn(on));
  if (anchor) requestAnimationFrame(() => { const top = anchor.getBoundingClientRect().top + window.scrollY - Math.max(0, Math.min(before, hdH)); window.scrollTo(0, top); if (lenis) lenis.scrollTo(top, { immediate: true }); });
}

export function scrollToEl(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const off = -(parseInt(getComputedStyle(html).getPropertyValue('--hd'), 10) || 72) + 1;
  if (lenis) lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : off, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: state.calm ? 'auto' : 'smooth' });
}

/* ---------------- En-tête ---------------- */
let hdLock = 0;
export function showHeader(ms = 2500) { hdLock = Date.now() + ms; const hd = document.getElementById('hd'); if (hd) hd.classList.remove('is-hidden'); }
function initHeader() {
  const hd = $('#hd');
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    hd.classList.toggle('is-solid', y > 40);
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const page = document.body.dataset.page;
  $$('.hd__nav a, .menu a').forEach((a) => {
    const href = a.getAttribute('href');
    if ((page === 'concerts' && href === 'concerts.html') || (page === 'booking' && href === 'programmateurs.html')) a.setAttribute('aria-current', 'page');
  });

  const burger = $('#burger');
  const menu = $('#menu');
  const setInert = (v) => $$('main, footer, .skip, .hd__nav, .hd__logo, #calmBtn, #cartBtn, .hd .lang, .mini').forEach((el) => { el.inert = v; });
  const close = () => { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; setInert(false); html.classList.remove('verrou'); lenis && lenis.start(); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) { setInert(true); html.classList.add('verrou'); lenis && lenis.stop(); if (gsap && !state.calm) gsap.from('.menu a', { y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out' }); menu.querySelector('a').focus(); }
    else close();
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { close(); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    // la tabulation tourne entre le bouton Menu et les liens du menu
    const f = [burger, ...$$('a[href], button', menu).filter((x) => x.offsetParent !== null)];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
  });

  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  $('#calmBtn').addEventListener('click', () => setCalm(!state.calm));
  // menu ouvert puis fenêtre élargie au-delà du format mobile : on le referme
  matchMedia('(max-width: 1080px)').addEventListener('change', (e) => { if (!e.matches && !menu.hidden) close(); });
}

/* ---------------- Liens : ancres et transitions de page ---------------- */
function initLinks() {
  // avec cleanUrls, l'adresse est « /concerts » quand le lien vaut « concerts.html »
  const norm = (f) => (f || '').replace(/\.html$/, '').replace(/^index$/, '');
  const here = norm(location.pathname.split('/').pop());
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (a.hasAttribute('download') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    const [file, hash] = href.split('#');
    const samePage = !file || norm(file) === here;
    if (samePage && hash) { e.preventDefault(); scrollToEl(document.getElementById(hash)); history.replaceState(null, '', '#' + hash); return; }
    if (samePage) { e.preventDefault(); scrollToEl(document.getElementById('top') || document.body); return; }
    if (!samePage && gsap && !state.calm) {
      e.preventDefault();
      const sm = $('#smoke'); sm.style.animation = 'none';
      gsap.fromTo(sm, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.in', onComplete: () => { location.href = href; } });
    }
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { const sm = $('#smoke'); sm.style.animation = 'none'; sm.style.opacity = '0'; } });
}

/* ---------------- Curseur braise et boutons magnétiques ---------------- */
function initCursor() {
  if (!fineHover || !gsap) return;
  const dot = $('.cursor__dot'), ring = $('.cursor__ring'), cur = $('.cursor');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => { cur.classList.toggle('is-hover', !!e.target.closest('a, button, [data-magnetic], label, summary, .track__bar')); });
  if (!state.calm) html.classList.add('has-cursor');
}
function initMagnetic() {
  if (!fineHover || !gsap) return;
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest('[data-magnetic]');
    $$('[data-magnetic].is-mag').forEach((m) => { if (m !== el) { m.classList.remove('is-mag'); gsap.to(m, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .4)' }); } });
    if (!el || state.calm) return;
    const r = el.getBoundingClientRect();
    el.classList.add('is-mag');
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
  }, { passive: true });
}

/* ---------------- Modales ---------------- */
let lastFocus = null;
export function openModal(htmlStr, onOpen, returnTo) {
  const m = $('#modal');
  $('#modalBody').innerHTML = htmlStr;
  lastFocus = returnTo || document.activeElement;
  m.hidden = false;
  html.classList.add('verrou');
  lenis && lenis.stop();
  if (gsap && !state.calm) gsap.fromTo('.modal__box', { y: 30, opacity: 0, rotate: -1 }, { y: 0, opacity: 1, rotate: 0, duration: 0.5, ease: 'power3.out' });
  const f = m.querySelector('h2, button, a, input'); if (f) { if (f.tagName === 'H2') f.setAttribute('tabindex', '-1'); f.focus(); }
  onOpen && onOpen($('#modalBody'));
}
export function closeModal() {
  const m = $('#modal');
  if (m.hidden) return;
  m.hidden = true; $('#modalBody').innerHTML = '';
  html.classList.remove('verrou');
  lenis && lenis.start();
  lastFocus && lastFocus.focus();
}
function trapFocus(container, e) {
  const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container).filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------------- Panier simulé ---------------- */
let cart = {};
try { cart = JSON.parse(store.get('will-cart') || '{}') || {}; } catch (e) { cart = {}; }
const euro = (n) => new Intl.NumberFormat(state.lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export { euro };
const imgSrc = (name, w) => `img/${name}-${w}.webp`;
function saveCart() { store.set('will-cart', JSON.stringify(cart)); renderCart(); }
function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
function cartTotal() { return Object.entries(cart).reduce((s, [id, q]) => s + (products[id] ? products[id].price * q : 0), 0); }
function renderCart() {
  $('#cartCount').dataset.n = cartCount(); // chiffre affiché en contenu généré : hors du nom accessible du bouton
  $('#cartBtn').setAttribute('aria-label', t('Ouvrir le panier', 'Open the basket') + (cartCount() ? ' (' + cartCount() + ')' : ''));
  const list = $('#cartList');
  const ids = Object.keys(cart).filter((id) => products[id] && cart[id] > 0);
  if (!ids.length) {
    list.innerHTML = `<li class="drawer__empty">${t('Votre panier est vide. Les disques et porte-clés s’ajoutent depuis la page d’accueil.', 'Your basket is empty. Add records and keyrings from the home page.')}</li>`;
  } else {
    list.innerHTML = ids.map((id) => {
      const p = products[id];
      return `<li class="citem" data-id="${id}"><img src="${imgSrc(p.img, p.imgSize)}" alt="" width="64" height="64">
        <div><div class="citem__t">${tt(p.title)}</div><div class="citem__p">${euro(p.price)} · ${t('réf.', 'ref.')} ${id}</div></div>
        <div class="qty"><button type="button" data-dec aria-label="${t('Retirer un exemplaire', 'Remove one')} : ${tt(p.title)}">−</button><span aria-label="${t('Quantité', 'Quantity')} ${cart[id]}">${cart[id]}</span><button type="button" data-inc aria-label="${t('Ajouter un exemplaire', 'Add one')} : ${tt(p.title)}">+</button></div></li>`;
    }).join('');
  }
  $('#cartTotal').textContent = euro(cartTotal());
  $('#checkoutBtn').disabled = !ids.length;
}
export function addToCart(id, fromEl) {
  if (!products[id]) return;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  showHeader(2600);
  const btn = $('#cartBtn');
  const img = fromEl && (fromEl.closest('[data-card]')?.querySelector('img') || fromEl.closest('section')?.querySelector('.jewel__case img'));
  const done = () => { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); };
  toast(t(`${tt(products[id].title)} ajouté au panier.`, `${tt(products[id].title)} added to the basket.`), { label: t('Voir le panier', 'View basket'), fn: openCart });
  if (!img || !gsap || state.calm) return done();
  const a = img.getBoundingClientRect(), b0 = btn.getBoundingClientRect();
  const b = { left: b0.left, top: Math.max(b0.top, 14), width: b0.width, height: b0.height };
  const fly = document.createElement('img');
  fly.src = img.currentSrc || img.src; fly.className = 'flyer'; fly.alt = '';
  const size = Math.min(a.width, 140);
  Object.assign(fly.style, { width: size + 'px', height: size + 'px', left: a.left + a.width / 2 - size / 2 + 'px', top: a.top + a.height / 2 - size / 2 + 'px' });
  document.body.appendChild(fly);
  const tx = b.left + b.width / 2 - (a.left + a.width / 2), ty = b.top + b.height / 2 - (a.top + a.height / 2);
  const tl = gsap.timeline({ onComplete: () => { fly.remove(); done(); } });
  tl.to(fly, { x: tx, duration: 0.85, ease: 'power1.inOut' }, 0)
    .to(fly, { y: Math.min(-120, ty - 160), duration: 0.38, ease: 'power2.out' }, 0)
    .to(fly, { y: ty, duration: 0.47, ease: 'power2.in' }, 0.38)
    .to(fly, { scale: 0.18, rotate: 200, duration: 0.85, ease: 'power2.in' }, 0)
    .to(fly, { opacity: 0, duration: 0.15 }, 0.72);
}
function openCart() {
  hideToast();
  const d = $('#drawer'); renderCart(); d.hidden = false; lastFocus = document.activeElement; html.classList.add('verrou'); lenis && lenis.stop();
  if (gsap && !state.calm) { gsap.fromTo('.drawer__panel', { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power3.out' }); gsap.fromTo('.drawer__veil', { opacity: 0 }, { opacity: 1, duration: 0.4 }); }
  d.querySelector('.x').focus();
}
function closeCart() {
  const d = $('#drawer'); if (d.hidden) return;
  const end = () => { d.hidden = true; html.classList.remove('verrou'); lenis && lenis.start(); lastFocus && lastFocus.focus(); };
  if (gsap && !state.calm) { gsap.to('.drawer__panel', { xPercent: 100, duration: 0.4, ease: 'power2.in', onComplete: end }); gsap.to('.drawer__veil', { opacity: 0, duration: 0.35 }); }
  else end();
}
function checkout() {
  const ids = Object.keys(cart).filter((id) => products[id] && cart[id] > 0);
  if (!ids.length) return;
  closeCart();
  setTimeout(() => openModal(`
    <h2 id="modalTitle">${t('Récapitulatif de commande', 'Order summary')}</h2>
    <p class="demo">${t('Démonstration : aucun paiement n’est demandé ici. La vraie commande se passe sur la boutique HelloAsso de Mezcal Nation Prod.', 'Demo: no payment is taken here. Real orders go through the Mezcal Nation Prod shop on HelloAsso.')}</p>
    <ul class="recap">${ids.map((id) => `<li><span>${cart[id]} × ${tt(products[id].title)}</span><b>${euro(products[id].price * cart[id])}</b></li>`).join('')}
      <li><span>${t('Livraison', 'Shipping')}</span><b>${t('offerte', 'free')}</b></li>
      <li><span><b>Total</b></span><b>${euro(cartTotal())}</b></li></ul>
    <p>${t('Paiement sécurisé accepté sur HelloAsso :', 'Secure payment accepted on HelloAsso:')}</p>
    <div class="pay" aria-label="${t('Moyens de paiement', 'Payment methods')}"><span>${t('Carte bancaire', 'Bank card')}</span><span>Visa</span><span>Mastercard</span></div>
    <p style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn--fire" href="${SHOP_URL}" target="_blank" rel="noopener">${t('Continuer sur HelloAsso', 'Continue on HelloAsso')}</a><button type="button" class="btn btn--ghost" data-clear>${t('Vider le panier', 'Empty basket')}</button></p>`,
  (body) => { body.querySelector('[data-clear]').addEventListener('click', () => { cart = {}; saveCart(); closeModal(); }); }, $('#cartBtn')), state.calm ? 0 : 420);
}
function initCart() {
  renderCart();
  $('#cartBtn').addEventListener('click', openCart);
  $('#checkoutBtn').addEventListener('click', checkout);
  $('#drawer').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeCart();
    const li = e.target.closest('.citem'); if (!li) return;
    const id = li.dataset.id;
    if (e.target.closest('[data-inc]')) cart[id]++;
    if (e.target.closest('[data-dec]')) { cart[id]--; if (cart[id] <= 0) delete cart[id]; }
    saveCart();
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) addToCart(b.dataset.add, b); });
  $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
    if (e.key === 'Tab') { if (!$('#modal').hidden) trapFocus($('.modal__box'), e); else if (!$('#drawer').hidden) trapFocus($('.drawer__panel'), e); }
  });
  onLang(renderCart);
}

/* Message bref en bas de l'écran (lu aussi par les lecteurs d'écran) */
let toastEl, toastTm;
function hideToast() { if (toastEl) toastEl.classList.remove('is-on'); }
export function toast(msg, action) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
  toastEl.innerHTML = `<span class="toast__msg">${msg}</span>${action ? `<button type="button" class="toast__btn">${action.label}</button>` : ''}`;
  if (action) toastEl.querySelector('.toast__btn').addEventListener('click', () => { hideToast(); action.fn(); });
  requestAnimationFrame(() => toastEl.classList.add('is-on'));
  clearTimeout(toastTm); toastTm = setTimeout(hideToast, 5000);
}

/* Annonces pour lecteurs d'écran */
let live;
export function announce(msg) {
  if (!live) { live = document.createElement('div'); live.setAttribute('aria-live', 'polite'); live.className = 'skip'; live.style.cssText = 'position:fixed;left:-9999px;top:auto'; document.body.appendChild(live); }
  live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 50);
}

/* ---------------- Dates (heure de Paris) ---------------- */
function lastSunday(y, m) { const d = new Date(Date.UTC(y, m + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
export function parisDate(dateStr, time) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = (time || '20:00').split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const start = lastSunday(y, 2).getTime() + 3600e3, end = lastSunday(y, 9).getTime() + 3600e3;
  const off = guess >= start && guess < end ? 2 : 1;
  return new Date(guess - off * 3600e3);
}
export function sortedConcerts(now = new Date()) {
  const all = concerts.map((c) => ({ ...c, at: parisDate(c.date, c.time), end: new Date(parisDate(c.date, c.time).getTime() + 3 * 3600e3) }));
  all.sort((a, b) => a.at - b.at);
  const upcoming = all.filter((c) => c.end > now);
  const past = all.filter((c) => c.end <= now).reverse();
  const next = upcoming.find((c) => c.status !== 'annule');
  return { all, upcoming, past, next };
}
export function fmtDate(d, opts) { return new Intl.DateTimeFormat(state.lang === 'en' ? 'en-GB' : 'fr-FR', { timeZone: 'Europe/Paris', ...opts }).format(d); }
export function fmtLong(c) {
  const day = fmtDate(c.at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return c.time ? `${day}, ${c.time.replace(':', state.lang === 'en' ? ':' : ' h ')}` : day;
}

/* Compte à rebours avec chiffres qui roulent */
export function countdown(root, target) {
  if (!root) return;
  const cells = { d: root.querySelector('[data-u="d"]'), h: root.querySelector('[data-u="h"]'), m: root.querySelector('[data-u="m"]'), s: root.querySelector('[data-u="s"]') };
  const prev = {};
  const set = (el, k, v) => {
    if (prev[k] === v) return;
    const animate = prev[k] !== undefined && gsap && !state.calm && document.visibilityState === 'visible';
    prev[k] = v;
    if (!animate) { el.innerHTML = `<span>${v}</span>`; return; }
    gsap.killTweensOf(el.children);
    while (el.children.length > 1) el.firstElementChild.remove();
    const old = el.firstElementChild; const nu = document.createElement('span'); nu.textContent = v;
    if (!old) { el.appendChild(nu); return; }
    gsap.set(old, { yPercent: 0, opacity: 1 });
    el.appendChild(nu);
    gsap.fromTo([old, nu], { yPercent: 0 }, { yPercent: -100, duration: 0.45, ease: 'power3.out', onComplete: () => { if (old.parentNode) old.remove(); gsap.set(nu, { yPercent: 0 }); } });
  };
  const tick = () => {
    let ms = Math.max(0, target - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    set(cells.d, 'd', String(d).padStart(2, '0')); set(cells.h, 'h', String(h).padStart(2, '0'));
    set(cells.m, 'm', String(m).padStart(2, '0')); set(cells.s, 's', String(s).padStart(2, '0'));
  };
  tick();
  return setInterval(tick, 1000);
}

/* ---------------- Carte schématique des concerts ---------------- */
const MAP = { lon0: 2.9, lon1: 5.5, lat0: 48.95, lat1: 50.25, k: Math.cos(49.6 * Math.PI / 180) };
const W = 600, H = Math.round(((MAP.lat1 - MAP.lat0) / ((MAP.lon1 - MAP.lon0) * MAP.k)) * 600);
export const proj = (lon, lat) => [((lon - MAP.lon0) / (MAP.lon1 - MAP.lon0)) * W, ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * H];
const line = (pts) => pts.map(([lo, la], i) => { const [x, y] = proj(lo, la); return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }).join(' ');
const smooth = (pts) => { const p = pts.map(([lo, la]) => proj(lo, la)); let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`; for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)},${((y0 + y1) / 2).toFixed(1)}`; } const l = p[p.length - 1]; return d + ` L${l[0].toFixed(1)},${l[1].toFixed(1)}`; };
const MEUSE = [[5.24, 48.95], [5.36, 49.12], [5.19, 49.37], [5.19, 49.49], [5.08, 49.61], [4.99, 49.65], [4.94, 49.70], [4.87, 49.70], [4.80, 49.74], [4.72, 49.77], [4.75, 49.82], [4.73, 49.88], [4.64, 49.94], [4.71, 49.99], [4.75, 50.06], [4.82, 50.14], [4.86, 50.25]];
const BORDER = [[3.96, 50.25], [4.10, 50.06], [4.13, 49.98], [4.30, 49.95], [4.48, 49.99], [4.62, 50.02], [4.70, 50.12], [4.80, 50.17], [4.87, 50.16], [4.88, 50.06], [4.83, 49.95], [4.93, 49.86], [5.03, 49.78], [5.15, 49.72], [5.25, 49.66], [5.38, 49.60], [5.5, 49.54]];
export function renderMap(el, { big = false, upcomingOnly = false } = {}) {
  const { all } = sortedConcerts();
  const now = new Date();
  const list = upcomingOnly ? all.filter((c) => c.end > now) : all;
  const up = all.filter((c) => c.end > now && c.status !== 'annule');
  const route = up.map((c) => proj(c.lon, c.lat));
  let routeD = '';
  route.forEach(([x, y], i) => { if (!i) { routeD = `M${x.toFixed(1)},${y.toFixed(1)}`; return; } const [px, py] = route[i - 1]; const mx = (px + x) / 2, my = Math.min(py, y) - 50; routeD += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`; });
  const [cvx, cvy] = proj(4.7167, 49.7625);
  // les communes autour de Sedan sont trop proches : elles ont leur encart agrandi
  const Z = { lon0: 4.66, lon1: 5.12, lat0: 49.6, lat1: 49.79 };
  const inZone = (c) => c.lon > Z.lon0 && c.lon < Z.lon1 && c.lat > Z.lat0 && c.lat < Z.lat1;
  const zoned = list.filter(inZone);
  const useInset = zoned.length > 1;
  const dot = (c, past, cancel, r) => `${!past && !cancel ? `<circle class="halo" r="${r * 2}"/>` : ''}<circle class="core" r="${past ? r * 0.72 : r}"/>`;
  const cls = (c) => `map__pt${c.end <= now ? ' is-past' : ''}${c.status === 'annule' ? ' is-cancel' : ''}`;
  const label = (c, dx0 = 12) => {
    const side = c.label || 'e';
    const [anchor, dx, dy] = { n: ['middle', 0, -14], s: ['middle', 0, 22], e: ['start', dx0, 4], w: ['end', -dx0, 4] }[side];
    return `<text class="map__city" x="${dx}" y="${dy}" text-anchor="${anchor}">${c.city}</text>`;
  };
  const seen = new Set();
  const pts = list.map((c) => {
    const [x, y] = proj(c.lon, c.lat);
    const past = c.end <= now, cancel = c.status === 'annule';
    let lab = '';
    if (!seen.has(c.city) && !(useInset && inZone(c))) { lab = label({ ...c, label: c.label && !inZone(c) ? c.label : (x > W * 0.78 ? 'w' : 'e') }); seen.add(c.city); }
    return `<g class="${cls(c)}" data-date="${c.date}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><g class="map__dot">${dot(c, past, cancel, 7)}</g>${lab}</g>`;
  }).join('');
  let inset = '';
  if (useInset) {
    const IW = 236, IH = 150, IX = W - IW - 14, IY = H - IH - 34, pad = 18;
    const ip = (lon, lat) => [IX + pad + ((lon - Z.lon0) / (Z.lon1 - Z.lon0)) * (IW - 2 * pad), IY + 24 + ((Z.lat1 - lat) / (Z.lat1 - Z.lat0)) * (IH - 24 - pad)];
    const [zx0, zy0] = proj(Z.lon0, Z.lat1), [zx1, zy1] = proj(Z.lon1, Z.lat0);
    const iseen = new Set();
    const ipts = zoned.map((c) => {
      const [x, y] = ip(c.lon, c.lat);
      const past = c.end <= now, cancel = c.status === 'annule';
      // le nom reste dans l'encart : on change de côté s'il déborde
      const est = c.city.length * 6.6 + 12;
      let side = c.label || 'e';
      if (side === 'w' && x - est < IX + 6) side = 'e';
      else if (side === 'e' && x + est > IX + IW - 6) side = 'w';
      const lab = iseen.has(c.city) ? '' : label({ ...c, label: side }, 10); iseen.add(c.city);
      return `<g class="${cls(c)}" data-date="${c.date}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><g class="map__dot">${dot(c, past, cancel, 5.5)}</g>${lab}</g>`;
    }).join('');
    inset = `<rect class="map__zoom" x="${zx0.toFixed(1)}" y="${zy0.toFixed(1)}" width="${(zx1 - zx0).toFixed(1)}" height="${(zy1 - zy0).toFixed(1)}"/>
      <g class="map__inset"><rect class="frame" x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="4"/><text class="map__inset-title" x="${IX + 10}" y="${IY + 17}">${t('Autour de Sedan', 'Around Sedan')}</text>${ipts}</g>`;
  }
  const [bx, by] = proj(4.45, 50.14), [fx, fy] = proj(3.55, 49.25);
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${t('Carte schématique des concerts dans les Ardennes et autour', 'Schematic map of the concerts in and around the Ardennes')}">
    <g class="map__g">
      <path class="map__border" d="${line(BORDER)}"/>
      <path class="map__river" d="${smooth(MEUSE)}"/>
      <text class="map__country" x="${bx}" y="${by}">${t('BELGIQUE', 'BELGIUM')}</text>
      <text class="map__country" x="${fx}" y="${fy}">FRANCE</text>
      <text class="map__label" x="${proj(4.80, 49.93)[0] + 8}" y="${proj(4.80, 49.93)[1]}">${t('la Meuse', 'the Meuse')}</text>
      <g class="map__ref" transform="translate(${cvx.toFixed(1)},${cvy.toFixed(1)})"><circle r="3.5"/><text class="map__label" x="-8" y="-8" text-anchor="end">Charleville-Mézières</text></g>
      ${routeD ? `<path class="map__road" d="${routeD}"/>` : ''}
      ${pts}
      ${inset}
    </g></svg><span class="map__note">${t('Carte schématique, non à l’échelle.', 'Schematic map, not to scale.')}</span>`;
  if (big) el.classList.add('map--big');
  return el;
}

/* ---------------- Données structurées (référencement des concerts) ---------------- */
function jsonLd() {
  const { upcoming } = sortedConcerts();
  const iso = (c) => {
    if (!c.time) return c.date;
    const [y, mo, d] = c.date.split('-').map(Number), [h, mi] = c.time.split(':').map(Number);
    const off = Math.round((Date.UTC(y, mo - 1, d, h, mi) - c.at.getTime()) / 3600e3);
    return `${c.date}T${c.time}:00+0${off}:00`;
  };
  const group = {
    '@type': 'MusicGroup', '@id': '#will', name: 'Will', alternateName: 'Willy « Will » Midoux', genre: ['Country', 'Country rock'],
    foundingLocation: { '@type': 'Place', name: 'Ardennes, France' }, email: 'mezcalnation@gmail.com',
    sameAs: ['https://www.facebook.com/willcountryrock', 'https://www.instagram.com/willcountryrock/', 'https://www.youtube.com/@willcountryrock', 'https://open.spotify.com/artist/0YI0hBnUt48gTlXG00BIwg'],
  };
  const events = upcoming.map((c) => ({
    '@type': 'MusicEvent', name: `Will – ${c.venue}`, startDate: iso(c),
    eventStatus: c.status === 'annule' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: c.venue, address: { '@type': 'PostalAddress', addressLocality: c.city, addressCountry: c.country === 'France' ? 'FR' : c.country } },
    performer: { '@id': '#will' },
  }));
  const el = document.createElement('script'); el.type = 'application/ld+json';
  el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [group, ...events] });
  document.head.appendChild(el);
}

/* ---------------- Initialisation commune ---------------- */
export function boot(pageInit) {
  html.classList.toggle('calm', state.calm);
  html.classList.toggle('motion', !state.calm);
  applyLang(state.lang, true);
  try { jsonLd(); } catch (e) { /* facultatif */ }
  const ftNext = () => { const { next } = sortedConcerts(); $$('[data-ft-next]').forEach((el) => { el.innerHTML = next ? `${t('Prochain concert :', 'Next concert:')} <a href="concerts.html">${next.city}, ${fmtDate(next.at, { day: 'numeric', month: 'long' })}</a>` : ''; }); };
  ftNext(); onLang(ftNext);
  initHeader();
  initLinks();
  initCart();
  initCursor();
  initMagnetic();
  pageInit && pageInit();
  if (!state.calm) { startLenis(); buildMotion(); }
  $$('#calmBtn').forEach((b) => b.setAttribute('aria-pressed', String(state.calm)));
  if (location.hash && location.hash.length > 1) {
    let el = null; try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* ancre invalide */ }
    if (el) setTimeout(() => scrollToEl(el), 300);
  }
  window.addEventListener('load', () => ScrollTrigger && ScrollTrigger.refresh());
}

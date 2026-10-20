// Page d'accueil : ouverture marquée au fer, hero, EP, lecteur au coin du feu,
// discographie sur planches, route de l'histoire, W-Team, vidéos, concerts, merch, contact.
import { boot, onMotion, onCalm, onLang, state, t, tt, $, $$, split, ses, sortedConcerts, fmtLong, fmtDate, countdown, renderMap, euro, fineHover, showHeader, getLenis } from './core.js';
import { releases, merch, SHOP_URL } from '../data/catalogue.js';
import { createEmbers } from './embers.js';
import { Player } from './audio.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const mm = (q) => window.matchMedia(q).matches;
// avec une souris, l'épinglage par transformation évite les sauts de mise en page (CLS) ; au doigt, l'épinglage natif reste plus stable
const PIN_TYPE = window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 'transform' : 'fixed';
const isMobileArt = () => mm('(max-aspect-ratio: 4/5)');

// Position d'un point d'une image affichée en object-fit: cover, en fraction du conteneur.
function coverPoint(box, iw, ih, u, v, px = 0.5, py = 0.5) {
  const w = box.clientWidth, h = box.clientHeight;
  const s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
  return [((w - dw) * px + u * dw) / w, ((h - dh) * py + v * dh) / h];
}

/* ---------- Contenus générés depuis les fichiers de données ---------- */
const LINK_NAMES = { spotify: 'Spotify', deezer: 'Deezer', amazon: 'Amazon Music', youtube: 'YouTube' };
function renderDisco() {
  const rots = [-2, 1.6, -1.2, 2.2, -1.8, 1.2, -2.4];
  $('#discoRail').innerHTML = releases.map((r, i) => {
    const srcset = r.coverSizes.map((w) => `img/${r.cover}-${w}.webp ${w}w`).join(', ');
    const buy = r.products.map((p) => `<button type="button" class="chip" data-add="${p.id}" aria-label="${t('Ajouter au panier', 'Add to basket')} : ${r.title}, ${p.format === 'cd' ? 'CD' : t('numérique', 'digital')}, ${euro(p.price)}">${p.format === 'cd' ? 'CD' : t('Numérique', 'Digital')} <b>${euro(p.price)}</b></button>`).join('');
    const links = Object.entries(r.links).map(([k, u]) => `<a href="${u}" target="_blank" rel="noopener">${LINK_NAMES[k]}</a>`).join('');
    return `<article class="rec" data-card data-rot="${rots[i % rots.length]}">
      <div class="rec__print" style="--rot:${rots[i % rots.length]}deg">
        <img src="img/${r.cover}-${r.coverSizes[Math.min(1, r.coverSizes.length - 1)]}.webp" srcset="${srcset}" sizes="(max-width: 700px) 70vw, 26vw" alt="${t('Pochette de', 'Cover of')} ${r.title}" loading="lazy" width="400" height="400">
        <span class="rec__year">${r.year}</span>
      </div>
      <div class="rec__info">
        ${r.artist !== 'Will' ? `<span class="rec__artist">${t('avec', 'with')} ${r.artist}</span>` : ''}
        <h3 class="rec__title">${r.title}</h3>
        <p class="rec__type">${tt(r.type)}</p>
        <div class="rec__buy">${buy}</div>
        ${r.products.filter((p) => p.note).map((p) => `<p class="rec__note">${p.format === 'cd' ? 'CD' : t('Numérique', 'Digital')} : ${tt(p.note)}</p>`).join('')}
        ${links ? `<div class="rec__links">${links}</div>` : ''}
      </div>
    </article>`;
  }).join('') + `<article class="rec rec--end"><div class="rec__print"><h3>${t('Toute la boutique', 'The whole shop')}</h3><p>${t('Albums, singles et merch des artistes du label associatif Mezcal Nation Prod. Port offert.', 'Albums, singles and merch from the artists of the Mezcal Nation Prod label. Free shipping.')}</p><a class="link" href="${SHOP_URL}" target="_blank" rel="noopener">HelloAsso</a></div></article>`;
}
function renderKeys() {
  $('#keys').innerHTML = merch.map((m) => `<li class="key" data-card>
    <div class="key__hang"><img class="key__img" src="img/${m.img}-${m.size}.webp" alt="${tt(m.title)}" loading="lazy" width="${m.size}" height="${m.size}"></div>
    <h3>${tt(m.title)}</h3><p>${tt(m.detail)}</p>
    <button type="button" class="chip" data-add="${m.id}">${t('Ajouter', 'Add')} <b>${euro(m.price)}</b></button></li>`).join('');
}
function renderNext() {
  const { next, upcoming } = sortedConcerts();
  const box = $('#heroNext');
  if (!next) { box.querySelector('[data-next="city"]').textContent = t('Bientôt', 'Soon'); box.querySelector('[data-next="when"]').textContent = t('Nouvelles dates à venir.', 'New dates coming.'); box.querySelector('[data-countdown]').hidden = true; return; }
  box.querySelector('[data-next="city"]').textContent = next.city;
  box.querySelector('[data-next="venue"]').textContent = next.venue;
  box.querySelector('[data-next="when"]').textContent = fmtLong(next);
  const days = Math.max(0, Math.round((next.at - Date.now()) / 864e5));
  box.querySelector('[data-next="sr"]').textContent = t(`Dans ${days} jours.`, `In ${days} days.`);
  if (!renderNext.timer) renderNext.timer = countdown(box.querySelector('[data-countdown]'), next.at.getTime());
  $('#homeDates').innerHTML = upcoming.slice(0, 3).map((c) => `<li class="date${c.status === 'annule' ? ' is-cancel' : ''}" data-date="${c.date}">
    <div class="date__d"><b>${fmtDate(c.at, { day: '2-digit' })}</b><span>${fmtDate(c.at, { month: 'short' }).replace('.', '')} ${fmtDate(c.at, { year: 'numeric' })}</span></div>
    <div><div class="date__city">${c.city} <small>(${c.dept})</small></div><div class="date__venue">${c.venue}</div></div>
    <div class="date__time">${c.status === 'annule' ? `<span class="stamp">${t('Annulé', 'Canceled')}</span>` : (c.time || '')}</div></li>`).join('');
}
function linkMapToDates(root = document) {
  $$('.date[data-date]', root).forEach((li) => {
    const on = (v) => $$(`.map__pt[data-date="${li.dataset.date}"]`).forEach((p) => p.classList.toggle('is-on', v));
    li.addEventListener('pointerenter', () => on(true)); li.addEventListener('pointerleave', () => on(false));
  });
}

/* ---------- Vidéos : YouTube chargé au clic seulement ---------- */
function initVideos(player) {
  $$('[data-yt]').forEach((b) => b.addEventListener('click', () => {
    if (b.querySelector('iframe')) return;
    player.pause();
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
    f.title = `${b.dataset.title || 'Will'}, ${t('vidéo YouTube', 'YouTube video')}`; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    b.appendChild(f); b.querySelector('.vid__play').remove();
  }));
}

/* ---------- Chemin de l'histoire ---------- */
function buildTrail() {
  const trail = $('#trail'), svg = $('#trailSvg');
  const steps = $$('.step', trail);
  const h = trail.offsetHeight;
  svg.setAttribute('viewBox', `0 0 64 ${h}`); svg.style.height = h + 'px';
  const X = parseFloat(getComputedStyle(trail).paddingLeft) + parseFloat(getComputedStyle(steps[0], '::before').left) + 9;
  const pts = steps.map((s) => [X, s.offsetTop + 23]);
  let d = `M${X},0 L${X},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const k = i % 2 ? 22 : -14;
    d += ` C${x0 + k},${y0 + (y1 - y0) * 0.35} ${x1 - k},${y1 - (y1 - y0) * 0.35} ${x1},${y1}`;
  }
  d += ` L${X},${h}`;
  $('#trailPath').setAttribute('d', d); $('#trailLit').setAttribute('d', d);
  const len = $('#trailLit').getTotalLength();
  $('#trailLit').style.strokeDasharray = len;
  $('#trailLit').style.strokeDashoffset = state.calm ? 0 : len;
  steps.forEach((s) => s.classList.toggle('is-lit', state.calm));
  return len;
}

/* ---------- Ouverture ---------- */
function playIntro(onDone) {
  const intro = $('#intro');
  if (!intro || document.documentElement.classList.contains('no-intro') || state.calm || !gsap) { if (intro) intro.remove(); onDone(); return; }
  ses.set('will-intro', '1');
  intro.style.animation = 'none';
  const logo = $('.intro__logo');
  const tl = gsap.timeline({ onComplete: () => { intro.remove(); } });
  tl.set('.intro__spark', { opacity: 1, x: -90, y: 60, scale: 0.6 })
    .to('.intro__spark', { x: 0, y: 0, scale: 1.4, duration: 0.28, ease: 'power3.out' })
    .to('.intro__spark', { scale: 6, opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.28)
    .to('.intro__glow', { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.25)
    .set(logo, { opacity: 1 }, 0.4)
    .fromTo(logo, { '--r': '0%' }, { '--r': '90%', duration: 0.7, ease: 'power2.inOut' }, 0.35)
    .fromTo(logo, { filter: 'brightness(2.6) sepia(1) saturate(5) hue-rotate(-18deg) drop-shadow(0px 0px 28px rgba(255,140,40,0.9))' },
      { filter: 'brightness(1) sepia(0) saturate(1) hue-rotate(0deg) drop-shadow(0px 0px 0px rgba(255,140,40,0))', duration: 0.75, ease: 'power1.inOut' }, 0.85)
    .to('.intro__glow', { opacity: 0.25, duration: 0.6 }, 0.95)
    .add(() => onDone(), 1.35)
    .to(intro, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 1.4)
    .to('.intro__wood', { scale: 1.08, duration: 0.5, ease: 'power2.in' }, 1.4);
  const skip = () => { if (tl.progress() < 1) tl.progress(1); off(); };
  const evs = ['click', 'wheel', 'touchstart', 'keydown'];
  const off = () => evs.forEach((ev) => window.removeEventListener(ev, skip));
  evs.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
}

/* ---------- Initialisation ---------- */
let heroEmbers, fireEmbers, player;
let introDone = false; const whenIntro = [];

boot(() => {
  renderDisco(); renderKeys(); renderNext();
  $$('[data-map="small"]').forEach((m) => renderMap(m, { upcomingOnly: true })); linkMapToDates();
  player = new Player($('#audio'));
  initVideos(player);
  onLang(() => { renderDisco(); renderKeys(); renderNext(); $$('[data-map="small"]').forEach((m) => renderMap(m, { upcomingOnly: true })); linkMapToDates(); player._ui(); ScrollTrigger && ScrollTrigger.refresh(); });

  // Emplacements du feu dans les images (mesurés sur les images Grok)
  const placeFire = () => {
    const box = $('.fire');
    const [fx, fy] = isMobileArt() ? coverPoint(box, 784, 1168, 0.48, 0.70, 0.64) : coverPoint(box, 1168, 784, 0.655, 0.62);
    box.style.setProperty('--fx', (fx * 100).toFixed(2) + '%'); box.style.setProperty('--fy', (fy * 100).toFixed(2) + '%');
    fireEmbers && fireEmbers.setEmitters([{ x: fx, y: fy + 0.02, spread: 0.12, rise: 0.75 }]);
    const hero = $('.hero'), hb = $('.hero__bg');
    const [hu, hv] = isMobileArt() ? coverPoint(hb, 784, 1168, 0.57, 0.85) : coverPoint(hb, 1168, 784, 0.54, 0.755);
    const R = hero.getBoundingClientRect(), r = hb.getBoundingClientRect();
    const hx = (r.left - R.left + hu * r.width) / R.width, hy = (r.top - R.top + hv * r.height) / R.height;
    heroEmbers && heroEmbers.setEmitters([{ x: 0.5, y: 1.04, spread: 1.4, rise: 1.0 }, { x: hx, y: hy, spread: 0.05, rise: 0.8 }]);
    const c = $('.contact');
    const [wx, wy] = isMobileArt() ? coverPoint(c, 784, 1168, 0.67, 0.64) : coverPoint(c, 1168, 784, 0.70, 0.64);
    c.style.setProperty('--wx', (wx * 100).toFixed(2) + '%'); c.style.setProperty('--wy', (wy * 100).toFixed(2) + '%');
  };

  const startEmbers = async () => {
    if (state.calm) return;
    const small = mm('(max-width: 700px)');
    if (!heroEmbers) heroEmbers = await createEmbers($('#heroEmbers'), { count: small ? 320 : 640, share: 0.35, size: 1, webgl: state.webgl });
    placeFire(); heroEmbers.start();
    document.documentElement.dataset.embers = heroEmbers.kind;
    if (fireEmbers) { fireEmbers.start(); return; }
    const io = new IntersectionObserver(async (en) => {
      if (!en[0].isIntersecting || fireEmbers || state.calm) return;
      io.disconnect();
      fireEmbers = await createEmbers($('#fireEmbers'), { count: small ? 420 : 900, size: 1.15, webgl: state.webgl });
      placeFire(); fireEmbers.start();
    }, { rootMargin: '600px 0px' });
    io.observe($('.fire'));
  };
  window.addEventListener('resize', placeFire);
  startEmbers();
  onCalm((on) => { if (on) { heroEmbers && heroEmbers.stop(); fireEmbers && fireEmbers.stop(); } else startEmbers(); });

  // Le feu suit la musique
  const wavePath = $('#wavePath'); const fireSec = $('.fire'); let avgBass = -1, glow = 0;
  const audioLoop = () => {
    const { bass, level, freq } = player.levels();
    if (avgBass < 0 && bass > 0) avgBass = bass;
    avgBass = avgBass * 0.97 + bass * 0.03;
    const pulse = Math.max(0, bass - avgBass) / Math.max(avgBass, 0.12);
    const e = Math.min(1, 0.15 + level * 0.9 + pulse * 0.9);
    fireEmbers && fireEmbers.setEnergy(e); heroEmbers && heroEmbers.setEnergy(e * 0.6);
    // montée rapide, retombée lente : la lueur respire avec la basse sans jamais clignoter
    glow += (e - glow) * (e > glow ? 0.18 : 0.04);
    fireSec.style.setProperty('--glow', (0.15 + glow * 0.6).toFixed(3));
    if (freq) {
      const n = 46; let d = '';
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (1.08 + (i / (n - 1)) * 0.84);
        const v = freq[2 + Math.floor(i * 1.1)] / 255;
        const r0 = 130, r1 = r0 + 6 + v * 62;
        const x0 = 200 + Math.cos(a) * r0, y0 = 210 + Math.sin(a) * r0, x1 = 200 + Math.cos(a) * r1, y1 = 210 + Math.sin(a) * r1;
        d += `M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}`;
      }
      wavePath.setAttribute('d', d);
    }
    if (player.playing) requestAnimationFrame(audioLoop);
    else { fireEmbers && fireEmbers.setEnergy(0); heroEmbers && heroEmbers.setEnergy(0); glow = 0; avgBass = -1; fireSec.style.setProperty('--glow', 0); }
  };
  let wasPlaying = false;
  player.on((p) => { fireSec.classList.toggle('is-live', p.playing && !state.calm); if (p.playing) { requestAnimationFrame(audioLoop); if (!wasPlaying) showHeader(2500); } wasPlaying = p.playing; });

  // Chemin de l'histoire (recalculé au redimensionnement)
  let trailLen = 0;
  const rebuild = () => { trailLen = buildTrail(); };
  window.addEventListener('load', rebuild); new ResizeObserver(() => rebuild()).observe($('#trail'));
  rebuild();
  onCalm(() => rebuild());

  playIntro(() => { introDone = true; whenIntro.splice(0).forEach((fn) => fn()); });

  /* ================= Mouvement (désactivé en mode calme) ================= */
  onMotion(() => {
    const cleanups = [];

    // Titres de section : mots qui montent depuis leur ligne
    const reveal = {
      // les mots montent depuis leur ligne
      rise: (el) => { const s = split(el, 'words'); if (s) gsap.from(s.words, { yPercent: 110, opacity: 0, rotate: 3, duration: 1.1, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 86%' } }); },
      // les lettres se gravent au fer : braise, puis métal refroidi
      burn: (el) => { const s = split(el, 'words,chars'); if (s) gsap.fromTo(s.chars, { color: '#ffb35c', textShadow: '0 0 18px rgba(255,140,40,.9)', opacity: 0 }, { color: '#f3ead7', textShadow: '0 0 0px rgba(255,140,40,0)', opacity: 1, duration: 0.8, stagger: 0.028, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' }, clearProps: 'color,textShadow' }); },
      // le titre se dévoile de gauche à droite, comme une planche qu'on découvre
      plank: (el) => { gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 86%' }, clearProps: 'clipPath' }); },
    };
    const style = { storyTitle: 'burn', contactTitle: 'burn', discoTitle: 'plank', merchTitle: 'plank', proTitle: 'burn' };
    $$('[data-split]').forEach((el) => {
      if (el.classList.contains('hero__tag')) return;
      (reveal[style[el.id]] || reveal.rise)(el);
    });

    // HERO : texte, parallaxe au défilement et à la souris
    const heroIn = () => {
      const s = split($('.hero__tag'), 'words');
      const tl = gsap.timeline();
      tl.from('.hero__logo', { y: 40, opacity: 0, duration: 1, ease: 'power3.out' })
        .from(s ? s.words : '.hero__tag', { yPercent: 100, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.035 }, 0.15)
        .from('.hero__sub, .hero__cta > *', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.5)
        .from('.next', { x: 40, opacity: 0, duration: 1, ease: 'power3.out' }, 0.55)
        .from('.hero__print', { y: -60, rotation: 14, opacity: 0, duration: 1.1, ease: 'back.out(1.4)' }, 0.35)
        .from('.hero__bg img', { scale: 1.06, duration: 2.4, ease: 'power2.out' }, 0);
    };
    if (introDone) heroIn(); else { gsap.set('.hero__inner', { opacity: 0 }); whenIntro.push(() => { gsap.set('.hero__inner', { opacity: 1 }); heroIn(); }); }
    gsap.to('.hero__bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__print', { yPercent: -18, rotation: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.hero__inner', { y: 0, opacity: 1 }, { y: -90, opacity: 0.1, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });
    if (fineHover) {
      const bx = gsap.quickTo('.hero__bg img', 'x', { duration: 1.4, ease: 'power3' }), by = gsap.quickTo('.hero__bg img', 'y', { duration: 1.4, ease: 'power3' });
      const fx = gsap.quickTo('.hero__fog', 'x', { duration: 2, ease: 'power3' });
      const onMove = (e) => { const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5; bx(nx * -26); by(ny * -16); fx(nx * 60); };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onMove));
    }

    // EP : la section reste en place, le boîtier tourne, le disque sort, la country vire au rock
    const ep = $('.ep');
    const heat = document.createElement('div'); heat.className = 'ep__heat';
    heat.style.cssText = 'position:absolute;inset:0;background:radial-gradient(80% 90% at 75% 60%, rgba(217,69,42,.75), rgba(120,30,14,.55) 55%, rgba(20,14,10,.4));mix-blend-mode:multiply;opacity:0;pointer-events:none';
    $('.ep__bg').appendChild(heat); cleanups.push(() => heat.remove());
    const big = mm('(min-width: 900px)');
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: ep, start: 'top top', end: big ? '+=110%' : 'bottom top', pin: big, pinType: PIN_TYPE, scrub: 0.6 } });
    tl.fromTo('#jewel', { rotationY: -30, rotationX: 10, y: big ? 0 : 0 }, { rotationY: 14, rotationX: 0, duration: 1 }, 0)
      .fromTo('#disc', { xPercent: 0, rotation: 0 }, { xPercent: big ? 46 : 28, rotation: 620, duration: 1 }, 0.05)
      .to(heat, { opacity: 1, duration: 1 }, 0)
      .fromTo('.ep__from', { opacity: 1 }, { opacity: 0.55, duration: 1 }, 0)
      .fromTo('.ep__to', { textShadow: '0 0 0px rgba(244,163,64,0)' }, { textShadow: '0 0 40px rgba(244,163,64,.75)', duration: 1 }, 0)
      .fromTo('.ep__bg img', { scale: 1.15, xPercent: -4 }, { scale: 1.02, xPercent: 0, duration: 1 }, 0);
    gsap.from('.ep__text > *', { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: ep, start: 'top 60%' } });

    // Au coin du feu
    gsap.from('.track', { x: -40, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.player', start: 'top 80%' } });
    gsap.fromTo('.fire__bg img', { scale: 1.06 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.fire', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Discographie : défilement horizontal sur planches, les tirages se balancent avec la vitesse
    const track = $('#discoTrack'), rail = $('#discoRail');
    const prints = $$('.rec:not(.rec--end) .rec__print');
    prints.forEach((p) => gsap.set(p, { rotation: parseFloat(p.closest('.rec').dataset.rot) || 0 }));
    const sway = prints.map((p) => gsap.quickTo(p, 'rotation', { duration: 0.9, ease: 'elastic.out(1, .35)' }));
    const swing = (v) => prints.forEach((p, i) => sway[i]((parseFloat(p.closest('.rec').dataset.rot) || 0) + gsap.utils.clamp(-9, 9, v / -220)));
    if (big) {
      track.style.overflow = 'visible';
      const dist = () => Math.max(0, rail.scrollWidth - innerWidth);
      const railTw = gsap.to(rail, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.disco', start: 'top top', end: () => '+=' + dist(), pin: true, pinType: PIN_TYPE, scrub: 0.8, invalidateOnRefresh: true, onUpdate: (self) => swing(self.getVelocity()) } });
      const onFocus = (e) => {
        const card = e.target.closest('.rec'); const st = railTw.scrollTrigger; if (!card || !st) return;
        const p = gsap.utils.clamp(0, 1, (card.offsetLeft - innerWidth * 0.3) / Math.max(1, dist()));
        const y = st.start + p * (st.end - st.start);
        if (getLenis()) getLenis().scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      };
      rail.addEventListener('focusin', onFocus);
      cleanups.push(() => rail.removeEventListener('focusin', onFocus));
      cleanups.push(() => { track.style.overflow = ''; });
    } else {
      let lastX = track.scrollLeft;
      const onS = () => { swing((track.scrollLeft - lastX) * -40); lastX = track.scrollLeft; }; track.addEventListener('scroll', onS, { passive: true });
      cleanups.push(() => track.removeEventListener('scroll', onS));
    }
    gsap.from('.rec', { y: 80, opacity: 0, rotation: () => gsap.utils.random(-8, 8), stagger: 0.08, duration: 1.1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.disco', start: big ? 'top 70%' : 'top 75%' } });
    if (fineHover) {
      $$('.rec').forEach((card) => {
        const pr = card.querySelector('.rec__print'); if (!pr) return;
        const rx = gsap.quickTo(pr, 'rotationX', { duration: 0.5 }), ry = gsap.quickTo(pr, 'rotationY', { duration: 0.5 });
        const mv = (e) => { const r = pr.getBoundingClientRect(); rx(((e.clientY - r.top) / r.height - 0.5) * -14); ry(((e.clientX - r.left) / r.width - 0.5) * 16); };
        const lv = () => { rx(0); ry(0); };
        gsap.set(pr, { transformPerspective: 900 });
        card.addEventListener('pointermove', mv); card.addEventListener('pointerleave', lv);
        cleanups.push(() => { card.removeEventListener('pointermove', mv); card.removeEventListener('pointerleave', lv); });
      });
    }

    // Interlude : la phrase de Will s'allume mot à mot avec le défilement
    const qs = split($('#quoteText'), 'words');
    if (qs) gsap.fromTo(qs.words, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top 75%', end: 'bottom 55%', scrub: true } });

    // Histoire : la piste se dessine, chaque étape s'allume comme une lanterne
    const lit = $('#trailLit');
    gsap.fromTo(lit, { strokeDashoffset: () => trailLen }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#trail', start: 'top 60%', end: 'bottom 60%', scrub: 0.5, invalidateOnRefresh: true } });
    $$('.step').forEach((s) => {
      ScrollTrigger.create({ trigger: s, start: 'top 62%', onEnter: () => s.classList.add('is-lit'), onLeaveBack: () => s.classList.remove('is-lit') });
      gsap.from(s.querySelectorAll('.step__body > *, .step__img'), { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 78%' } });
    });
    $$('.story [data-speed]').forEach((el) => gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 100, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.trail__end', { opacity: 0, y: 30, duration: 1, scrollTrigger: { trigger: '.trail__end', start: 'top 85%' } });

    // W-Team : les tirages tombent et se posent
    gsap.from('.pin', { y: -120, rotation: () => gsap.utils.random(-14, 14), opacity: 0, duration: 1, ease: 'back.out(1.3)', stagger: 0.12, scrollTrigger: { trigger: '.board', start: 'top 78%' } });
    gsap.fromTo('.team__bg img', { scale: 1.06 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.team', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Vidéos : les volets de la fenêtre s'ouvrent
    gsap.fromTo('.vid__btn', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.vids', start: 'top 80%' }, clearProps: 'clipPath' });

    // Concerts : la route se trace, les dates s'allument
    const road = $('.gigs .map__road');
    if (road) { const L = road.getTotalLength(); gsap.fromTo(road, { strokeDasharray: `${L}`, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', scrollTrigger: { trigger: '.gigs__map', start: 'top 75%' }, onComplete: () => { road.style.strokeDasharray = ''; } }); }
    gsap.from('.gigs .map__dot', { scale: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(2.5)', stagger: 0.12, scrollTrigger: { trigger: '.gigs__map', start: 'top 75%' } });
    gsap.from('#homeDates .date', { x: 50, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#homeDates', start: 'top 82%' } });
    

    // Merch : les porte-clés se balancent
    const hangs = $$('.key__hang');
    gsap.from(hangs, { rotation: 28, duration: 2.2, ease: 'elastic.out(1, .25)', stagger: 0.2, scrollTrigger: { trigger: '#keys', start: 'top 80%' } });
    const swings = hangs.map((h) => gsap.quickTo(h, 'rotation', { duration: 1.6, ease: 'elastic.out(1, .2)' }));
    let keyTm;
    ScrollTrigger.create({ trigger: '.merch', start: 'top bottom', end: 'bottom top', onUpdate: (self) => { const v = gsap.utils.clamp(-14, 14, self.getVelocity() / -160); swings.forEach((q) => q(v)); clearTimeout(keyTm); keyTm = setTimeout(() => swings.forEach((q) => q(0)), 120); } });
    cleanups.push(() => clearTimeout(keyTm));

    // Programmateurs
    gsap.fromTo('.pro__img img', { scale: 1.25, clipPath: 'inset(0 0 100% 0)' }, { scale: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: '.pro', start: 'top 70%' } });
    gsap.from('.pro__text > *:not(h2)', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.pro', start: 'top 60%' } });

    // Contact : la fenêtre s'allume, l'adresse se grave au fer
    gsap.fromTo('.contact__light', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 80%', end: 'center center', scrub: true } });
    const ms = split($('[data-burn]'), 'chars');
    if (ms) gsap.fromTo(ms.chars, { color: '#ffb35c', textShadow: '0 0 18px rgba(255,140,40,.95)', opacity: 0 }, { color: '#f3ead7', textShadow: '0 0 0px rgba(255,140,40,0)', opacity: 1, duration: 0.9, stagger: 0.035, ease: 'power2.out', scrollTrigger: { trigger: '.contact__mail', start: 'top 85%' } });
    gsap.from('.socials li', { y: 20, opacity: 0, stagger: 0.08, duration: 0.7, scrollTrigger: { trigger: '.socials', start: 'top 90%' } });

    return () => cleanups.forEach((c) => c());
  });
});

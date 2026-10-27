// Page Programmateurs : ampoules qui s'allument une à une, chiffres qui défilent,
// cartes de formules qui se retournent, kit presse, demande de date en 4 étapes (mèche qui brûle).
import { boot, onMotion, onCalm, onLang, state, t, $, $$, split, announce } from './core.js?v=20261027';

const gsap = window.gsap;
const mm = (q) => window.matchMedia(q).matches;

const BULBS = {
  desk: { iw: 1168, ih: 784, pts: [[0.218, 0.036], [0.283, 0.071], [0.366, 0.106], [0.455, 0.125], [0.544, 0.131], [0.632, 0.122], [0.719, 0.102], [0.805, 0.07], [0.88, 0.028]] },
  mob: { iw: 784, ih: 1168, pts: [[0.083, 0.267], [0.259, 0.21], [0.36, 0.276], [0.529, 0.146], [0.689, 0.224], [0.878, 0.185]] },
};
function placeBulbs() {
  const box = $('.phero'), wrap = $('#bulbs');
  const B = mm('(max-aspect-ratio: 4/5)') ? BULBS.mob : BULBS.desk;
  const w = box.clientWidth, h = box.clientHeight, s = Math.max(w / B.iw, h / B.ih), dw = B.iw * s, dh = B.ih * s;
  const ox = (w - dw) / 2, oy = (h - dh) / 2;
  wrap.style.height = '100%';
  wrap.innerHTML = B.pts.map(([u, v], i) => `<span class="bulb" style="left:${ox + u * dw}px;top:${oy + v * dh}px" data-i="${i}"></span>`).join('');
  if (state.calm) $$('.bulb').forEach((b) => { b.style.opacity = 1; });
}

/* ---------- Kit presse : biographies téléchargeables ---------- */
const BIO = {
  'bio-fr': `Will – country rock des Ardennes

Originaire des Ardennes, passionné de musique depuis l’enfance, Willy « Will » Midoux commence à chanter et à composer en 1992. Ses premières armes sont le hard-rock et le métal, avec plusieurs albums en groupe.

Attiré par les États-Unis, leurs grands espaces et leur sensation de liberté, il se tourne vers la country. En 2013, il devient chanteur guitariste de Mezcal, groupe ardennais de country rock : un album studio de 12 titres, « White And Red » (2015), et un live acoustique, « Live Unplugged », enregistré en 2017 en première partie de Ian Scott.

Après 25 ans en groupe, Will se lance en solo : « Second Life » (mai 2019, 10 titres), « Not Alone » (29 mai 2021, 11 titres), puis « Share » (13 mai 2023, 10 titres), fait de rencontres, de duos et de collaborations, après des concerts en France, en Belgique et en Allemagne. Son EP « From Country To Rock » (5 titres, premier single « It’s Your Day ») est sorti le 12 septembre 2026.

En formation électrique avec la W-Team (Bruno Henry aux guitares, Martial Boucher à la basse, Yannick Pierre à la batterie), en acoustique ou en duo acoustique.

Label et booking : Mezcal Nation Prod – mezcalnation@gmail.com
Crédits photo : Gwenaëlle Midoux, Pascal Cordier, Wendy Steenmans (à confirmer)`,
  'bio-en': `Will – country rock from the French Ardennes

Born and raised in the Ardennes, in France’s Grand Est region, Willy "Will" Midoux has loved music since childhood. He started writing and singing his own songs in 1992. His first projects were hard rock and metal, with several albums in that style.

Drawn to the United States, its wide open spaces and its sense of freedom, he turned to country music. In 2013 he became the singer and guitarist of MEZCAL, a country rock band from the Ardennes, who released the 12-track studio album "White and Red" (2015) and the acoustic "Live Unplugged", recorded in 2017 while opening for Ian Scott.

After 25 years in bands, Will went solo: "Second Life" (May 2019, 10 tracks), "Not Alone" (May 2021, 11 tracks) and "Share" (13 May 2023, 10 tracks), an album of encounters, duets and collaborations, after shows in France, Belgium and Germany. His EP "From Country To Rock" (5 tracks, lead single "It’s Your Day") came out on 12 September 2026.

On stage with the W-Team (Bruno Henry on guitars, Martial Boucher on bass, Yannick Pierre on drums), acoustic, or as an acoustic duo.

Label and booking: Mezcal Nation Prod – mezcalnation@gmail.com
Photo credits: Gwenaëlle Midoux, Pascal Cordier, Wendy Steenmans (to be confirmed)`,
};
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = `will-${name}.txt`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  announce(t('Biographie téléchargée.', 'Biography downloaded.'));
}

/* ---------- Demande de date en étapes ---------- */
function initWizard() {
  const form = $('#wiz'), steps = $$('fieldset[data-step], [data-step="4"]', form), lis = $$('#wizSteps li');
  const back = $('#wizBack'), next = $('#wizNext'), err = $('#wizErr');
  let cur = 0;
  const label = (name) => { const el = form.querySelector(`input[name="${name}"]:checked`); return el ? form.querySelector(`label[for="${el.id}"]`).textContent : ''; };
  const fuse = (k) => {
    const p = k / 4;
    const burnt = $('#fuseBurnt'), spark = $('#fuseSpark');
    if (gsap && !state.calm) { gsap.to(burnt, { width: p * 100 + '%', duration: 0.9, ease: 'power2.inOut' }); gsap.to(spark, { left: p * 100 + '%', duration: 0.9, ease: 'power2.inOut' }); }
    else { burnt.style.width = p * 100 + '%'; spark.style.left = p * 100 + '%'; }
    spark.style.opacity = p >= 1 ? 0 : 1;
  };
  const show = (k) => {
    steps.forEach((s, i) => { s.hidden = i !== k; });
    lis.forEach((li, i) => { if (i === Math.min(k, 3)) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    back.hidden = k === 0 || k === 4; next.hidden = k === 4;
    next.textContent = k === 3 ? t('Envoyer la demande (démo)', 'Send request (demo)') : t('Continuer', 'Continue');
    err.textContent = '';
    fuse(k);
    if (gsap && !state.calm && steps[k]) gsap.from(steps[k], { x: 30, opacity: 0, duration: 0.5, ease: 'power3.out' });
    const f = steps[k] && steps[k].querySelector('input, select, textarea, button, h3'); if (f && cur !== k) f.focus({ preventScroll: true });
    cur = k;
  };
  // renvoie [message, champ fautif]
  const check = (k) => {
    if (k === 0 && !form.querySelector('input[name="type"]:checked')) return [t('Choisissez un type d’événement.', 'Choose a type of event.'), form.querySelector('#t1')];
    if (k === 1) {
      if (!form.fDate.value) return [t('Indiquez la date souhaitée.', 'Enter the date you have in mind.'), form.fDate];
      if (new Date(form.fDate.value + 'T23:59') < new Date()) return [t('Cette date est déjà passée : choisissez une date à venir.', 'That date has passed: choose a future date.'), form.fDate];
      if (!form.fCity.value.trim()) return [t('Indiquez la ville.', 'Enter the town or city.'), form.fCity];
    }
    if (k === 2 && !form.querySelector('input[name="formula"]:checked')) return [t('Choisissez une formule, ou « Conseillez-moi ».', 'Choose a line-up, or “Advise me”.'), form.querySelector('#f1')];
    if (k === 3) {
      if (!form.fName.value.trim()) return [t('Indiquez votre nom.', 'Enter your name.'), form.fName];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fMail.value.trim())) return [t('Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.', 'Enter a valid email address, for example name@example.com.'), form.fMail];
    }
    return ['', null];
  };
  const clearInvalid = () => $$('[aria-invalid]', form).forEach((el) => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  const done = () => {
    const d = form.fDate.value ? new Intl.DateTimeFormat(state.lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(form.fDate.value + 'T12:00')) : '';
    const gear = form.fGear.options[form.fGear.selectedIndex];
    const rows = [[t('Événement', 'Event'), label('type')], [t('Date', 'Date'), d], [t('Lieu', 'Place'), [form.fVenue.value.trim(), form.fCity.value.trim()].filter(Boolean).join(', ')], [t('Formule', 'Line-up'), label('formula')], [t('Matériel', 'Equipment'), gear && gear.value ? gear.textContent : '—'], [t('Contact', 'Contact'), `${form.fName.value.trim()} · ${form.fMail.value.trim()}${form.fPhone.value.trim() ? ' · ' + form.fPhone.value.trim() : ''}`]];
    const body = rows.map(([k, v]) => `${k} : ${v}`).join('\n') + (form.fMsg.value.trim() ? `\n\n${form.fMsg.value.trim()}` : '');
    const mailto = `mailto:mezcalnation@gmail.com?subject=${encodeURIComponent(t('Demande de date pour Will', 'Date request for Will'))}&body=${encodeURIComponent(body)}`;
    $('#wizDone').innerHTML = `<h3 tabindex="-1" style="font-size:1.6rem;color:var(--night)">${t('Demande prête', 'Request ready')}</h3>
      <p class="demo">${t('Démonstration : rien n’a été envoyé. Pour l’envoyer vraiment, ouvrez-la dans votre messagerie.', 'Demo: nothing was sent. To really send it, open it in your email app.')}</p>
      <ul class="wiz__recap">${rows.map(([k, v]) => `<li><b>${k}</b><span>${v || '—'}</span></li>`).join('')}</ul>
      <p style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn--fire" href="${mailto}">${t('Ouvrir dans ma messagerie', 'Open in my email app')}</a><button type="button" class="btn btn--ghost" id="wizAgain">${t('Nouvelle demande', 'New request')}</button></p>`;
    show(4);
    $('#wizAgain').addEventListener('click', () => { form.reset(); show(0); });
    $('#wizDone h3').focus();
  };
  next.addEventListener('click', () => {
    clearInvalid();
    const [m, field] = check(cur);
    if (m) {
      err.textContent = m;
      if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'wizErr'); field.focus(); }
      if (gsap && !state.calm) gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, .3)' });
      return;
    }
    if (cur === 3) done(); else show(cur + 1);
  });
  back.addEventListener('click', () => show(Math.max(0, cur - 1)));
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', () => { err.textContent = ''; clearInvalid(); });
  const minD = new Date(); form.fDate.min = minD.toISOString().slice(0, 10);
  show(0);
  onLang(() => show(cur));
}

boot(() => {
  placeBulbs(); window.addEventListener('resize', placeBulbs);
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-flip]'); if (f) { const card = f.closest('.flip'); card.classList.toggle('is-flipped'); const face = card.classList.contains('is-flipped') ? card.querySelector('.flip__back') : card.querySelector('.flip__front'); setTimeout(() => face.querySelector('[data-flip]').focus({ preventScroll: true }), state.calm ? 0 : 450); }
    const d = e.target.closest('[data-dl]'); if (d) download(d.dataset.dl, BIO[d.dataset.dl]);
  });
  // faces cachées hors d'atteinte du clavier
  const syncFaces = () => $$('.flip').forEach((c) => { const fl = c.classList.contains('is-flipped'); c.querySelector('.flip__front').inert = fl; c.querySelector('.flip__back').inert = !fl; });
  new MutationObserver(syncFaces).observe($('.forms'), { attributes: true, subtree: true, attributeFilter: ['class'] }); syncFaces();
  initWizard();
  onCalm((on) => { if (on) $$('.bulb').forEach((b) => { b.style.opacity = 1; }); $('.phero__bg img').style.filter = ''; });

  onMotion(() => {
    $$('[data-split]').forEach((el) => {
      const s = split(el, 'words'); if (!s) return;
      const hero = el.id === 'pTitle';
      gsap.from(s.words, { yPercent: 110, opacity: 0, rotate: 3, duration: hero ? 1.2 : 1.1, ease: 'power4.out', stagger: 0.06, delay: hero ? 0.3 : 0, scrollTrigger: hero ? undefined : { trigger: el, start: 'top 86%' } });
    });
    // les ampoules s'allument une à une (une toutes les 0,4 s : jamais de clignotement)
    const img = $('.phero__bg img');
    const tl = gsap.timeline();
    tl.fromTo(img, { filter: 'brightness(0.22) saturate(0.7)' }, { filter: 'brightness(1) saturate(1)', duration: $$('.bulb').length * 0.4 + 0.6, ease: 'power1.in' }, 0)
      .fromTo('.bulb', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', stagger: 0.4 }, 0.2);
    gsap.from('.phero__lead, .phero .hero__cta > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, delay: 0.5, ease: 'power3.out' });
    gsap.to('.phero__bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
    // chiffres qui défilent
    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count), from = end > 1000 ? end - 60 : 0; const o = { v: from };
      gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '#facts', start: 'top 85%' }, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
    gsap.from('.fact', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '#facts', start: 'top 85%' } });
    gsap.from('.flip', { y: 80, rotationY: -25, opacity: 0, stagger: 0.15, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.forms', start: 'top 80%' } });
    gsap.from('.pitch__q, .pitch aside', { y: 30, opacity: 0, stagger: 0.15, duration: 1, scrollTrigger: { trigger: '.pitch', start: 'top 78%' } });
    gsap.from('.kit figure', { clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: '.kit', start: 'top 75%' } });
    gsap.from('.dl li', { x: 30, opacity: 0, stagger: 0.08, duration: 0.7, scrollTrigger: { trigger: '.dl', start: 'top 85%' } });
    gsap.from('.ask figure', { rotate: -8, y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.ask', start: 'top 75%' } });
    gsap.from('.wiz', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.wiz', start: 'top 85%' } });
    return () => { $('.phero__bg img').style.filter = ''; };
  });
});

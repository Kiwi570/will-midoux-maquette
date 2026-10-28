// Lecteur d'extraits : le son ne démarre qu'après un clic. Analyse des fréquences
// pour faire réagir les braises et l'onde gravée autour du feu.
import { $, $$, t, announce } from './core.js?v=20261028-2';

export const TRACKS = [
  { src: 'audio/a-cabin-in-the-woods-extrait.mp3', title: 'A Cabin In The Woods' },
  { src: 'audio/is-this-heaven-extrait.mp3', title: 'Is This Heaven' },
  { src: 'audio/a-brand-new-day-extrait.mp3', title: 'A Brand New Day' },
];

export class Player {
  constructor(audioEl) {
    this.a = audioEl; this.i = -1; this.ctx = null; this.an = null; this.freq = null; this.wave = null;
    this.listeners = [];
    this.a.addEventListener('timeupdate', () => this._progress());
    this.a.addEventListener('ended', () => { this._ui(); this.emit(); });
    this.a.addEventListener('play', () => { this._ui(); this.emit(); });
    this.a.addEventListener('pause', () => { this._ui(); this.emit(); });
    this.a.addEventListener('error', () => { announce(t('Extrait indisponible.', 'Clip unavailable.')); this._ui(); });
    $$('[data-play]').forEach((b) => b.addEventListener('click', () => this.toggle(Number(b.dataset.play))));
    $$('.track__bar').forEach((bar) => bar.addEventListener('click', (e) => {
      const li = bar.closest('.track'); const idx = Number(li.dataset.track);
      if (idx !== this.i || !this.a.duration) return;
      const r = bar.getBoundingClientRect(); this.a.currentTime = ((e.clientX - r.left) / r.width) * this.a.duration;
    }));
    $$('[data-mini]').forEach((m) => m.addEventListener('click', () => this.toggle(this.i)));
  }
  on(fn) { this.listeners.push(fn); }
  emit() { this.listeners.forEach((fn) => fn(this)); }
  get playing() { return !this.a.paused && !this.a.ended; }
  _graph() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ctx = new AC();
      const src = this.ctx.createMediaElementSource(this.a);
      this.an = this.ctx.createAnalyser(); this.an.fftSize = 256; this.an.smoothingTimeConstant = 0.78;
      src.connect(this.an); this.an.connect(this.ctx.destination);
      this.freq = new Uint8Array(this.an.frequencyBinCount);
    } catch (e) { this.ctx = null; this.an = null; }
  }
  toggle(i) {
    if (i < 0) return;
    if (i === this.i && this.playing) { this.a.pause(); return; }
    if (i !== this.i) { this.i = i; this.a.src = TRACKS[i].src; }
    this._graph();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.a.play().catch(() => {});
  }
  pause() { this.a.pause(); }
  levels() {
    if (!this.an || !this.playing) return { bass: 0, level: 0, freq: null };
    this.an.getByteFrequencyData(this.freq);
    let b = 0, l = 0; const n = this.freq.length;
    for (let k = 0; k < 10; k++) b += this.freq[k];
    for (let k = 0; k < n; k++) l += this.freq[k];
    return { bass: b / (10 * 255), level: l / (n * 255), freq: this.freq };
  }
  _progress() {
    const li = $(`.track[data-track="${this.i}"]`); if (!li || !this.a.duration) return;
    li.querySelector('.track__bar i').style.width = (this.a.currentTime / this.a.duration) * 100 + '%';
    const left = Math.max(0, this.a.duration - this.a.currentTime);
    li.querySelector('.track__time').textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  }
  _ui() {
    $$('.track').forEach((li) => {
      const on = Number(li.dataset.track) === this.i && this.playing;
      li.classList.toggle('is-playing', on);
      const b = li.querySelector('.track__play');
      b.setAttribute('aria-label', (on ? t('Mettre en pause ', 'Pause ') : t('Écouter ', 'Play ')) + TRACKS[li.dataset.track].title);
    });
    $$('[data-play]').forEach((b) => { const on = Number(b.dataset.play) === this.i && this.playing; b.setAttribute('aria-pressed', String(on)); if (!b.classList.contains('track__play')) b.classList.toggle('is-playing', on); });
    const show = this.i >= 0 && !(this.a.ended);
    $$('#mini, #miniFloat').forEach((m) => { m.hidden = !show; m.classList.toggle('is-playing', this.playing); });
    $$('[data-mini-title]').forEach((el) => { el.textContent = this.i >= 0 ? TRACKS[this.i].title : ''; });
    $$('[data-mini]').forEach((b) => { b.innerHTML = this.playing ? '<span class="ico-pause"></span>' : '<span class="ico-play"></span>'; b.setAttribute('aria-label', (this.playing ? t('Mettre en pause ', 'Pause ') : t('Reprendre ', 'Resume ')) + (this.i >= 0 ? TRACKS[this.i].title : '')); });
  }
}

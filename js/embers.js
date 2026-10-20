// Braises de feu de camp : particules WebGL (OGL) qui montent, dérivent, fuient le curseur
// et s'intensifient avec la musique. Version canvas 2D si WebGL n'est pas disponible.

const VERT = `
attribute vec3 position;
attribute vec4 aSeed;
attribute float aEmit;
uniform float uTime, uEnergy, uSize, uDpr;
uniform vec2 uRes, uMouse;
uniform vec4 uE0, uE1; // x, y (0-1), étalement, hauteur de montée
varying float vLife;
varying float vSeed;
void main() {
  vec4 e = mix(uE0, uE1, aEmit);
  float speed = mix(0.05, 0.14, aSeed.z) * (1.0 + uEnergy * 1.6);
  float life = fract(aSeed.x + uTime * speed);
  vec2 o = e.xy * uRes;
  float x = o.x + (aSeed.y - 0.5) * e.z * uRes.x * (0.22 + life * 0.95);
  x += sin(uTime * (0.5 + aSeed.z) + aSeed.x * 31.0) * 38.0 * life;
  x += sin(uTime * 0.27 + aSeed.y * 17.0) * 22.0 * life;
  float y = o.y - life * e.w * uRes.y - aSeed.w * 6.0;
  vec2 p = vec2(x, y);
  vec2 d = p - uMouse;
  float dist = length(d);
  p += normalize(d + 0.0001) * 70.0 * smoothstep(170.0, 0.0, dist) * (0.3 + life);
  vec2 clip = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  float s = mix(1.2, 4.6, aSeed.w * aSeed.w) * uSize * (1.0 - life * 0.55) * (1.0 + uEnergy * 0.9);
  gl_PointSize = s * uDpr * 2.2;
  vLife = life;
  vSeed = aSeed.w + aSeed.x;
}`;

const FRAG = `
precision highp float;
varying float vLife;
varying float vSeed;
uniform float uTime, uEnergy;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 2.4);
  vec3 hot = vec3(1.0, 0.88, 0.6);
  vec3 warm = vec3(0.98, 0.56, 0.2);
  vec3 cool = vec3(0.72, 0.18, 0.07);
  vec3 col = mix(hot, warm, smoothstep(0.0, 0.3, vLife));
  col = mix(col, cool, smoothstep(0.3, 0.92, vLife));
  float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
  float flick = 0.78 + 0.22 * sin(uTime * 5.0 + vSeed * 40.0);
  float a = glow * fade * flick * (0.75 + uEnergy * 0.6);
  gl_FragColor = vec4(col * a, a);
}`;

export class Embers {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = Object.assign({ count: 600, emitters: [{ x: 0.5, y: 1.02, spread: 1.2, rise: 1.1 }], size: 1, share: 0.5 }, opts);
    this.energy = 0; this.target = 0; this.running = false; this.visible = true; this.t0 = performance.now();
    this.mouse = [-9999, -9999];
    this.gl = null;
    this._init2D();
    this._resize = this._resize.bind(this);
    this._loop = this._loop.bind(this);
    this.ro = new ResizeObserver(this._resize); this.ro.observe(canvas.parentElement || canvas);
    this.io = new IntersectionObserver((en) => { this.visible = en[0].isIntersecting; if (this.visible && this.running) this._kick(); }, { rootMargin: '100px' });
    this.io.observe(canvas);
    this._onMove = (e) => { const r = this.canvas.getBoundingClientRect(); this.mouse = [e.clientX - r.left, e.clientY - r.top]; };
    window.addEventListener('pointermove', this._onMove, { passive: true });
    this._resize();
  }
  setEmitters(list) { this.opts.emitters = list; if (this.program) this._uniformsEmit(); }
  setEnergy(v) { this.target = Math.max(0, Math.min(1.5, v)); }
  start() { if (this.running) return; this.running = true; this._kick(); }
  stop() { this.running = false; if (this.gl && this.renderer) { this.gl.clear(this.gl.COLOR_BUFFER_BIT); } else if (this.ctx) { this.ctx.clearRect(0, 0, this.w, this.h); } }
  destroy() { this.stop(); this.ro.disconnect(); this.io.disconnect(); window.removeEventListener('pointermove', this._onMove); }
  _kick() { if (!this._raf) this._raf = requestAnimationFrame(this._loop); }
  _resize() {
    const r = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (this.renderer) {
      this.renderer.setSize(this.w, this.h);
      this.program.uniforms.uRes.value = [this.w, this.h];
      this.program.uniforms.uDpr.value = this.dpr;
    } else if (this.ctx) {
      this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }
  _loop(now) {
    this._raf = null;
    if (!this.running || !this.visible) return;
    const t = (now - this.t0) / 1000;
    this.energy += (this.target - this.energy) * 0.12;
    if (this.renderer) {
      const u = this.program.uniforms;
      u.uTime.value = t; u.uEnergy.value = this.energy; u.uMouse.value = this.mouse;
      this.renderer.render({ scene: this.mesh });
    } else this._draw2D(t);
    this._kick();
  }
  _uniformsEmit() {
    const e = this.opts.emitters; const a = e[0], b = e[1] || e[0];
    this.program.uniforms.uE0.value = [a.x, a.y, a.spread, a.rise];
    this.program.uniforms.uE1.value = [b.x, b.y, b.spread, b.rise];
  }

  /* ---- version canvas 2D ---- */
  _init2D() {
    this.ctx = this.canvas.getContext('2d');
    const n = Math.round(this.opts.count * 0.35);
    this.parts = Array.from({ length: n }, () => this._seed2D(Math.random()));
  }
  _seed2D(life) {
    const e = this.opts.emitters; const em = e.length > 1 && Math.random() < this.opts.share ? e[1] : e[0];
    return { life, em, sx: Math.random() - 0.5, sp: 0.05 + Math.random() * 0.09, sz: 1.2 + Math.random() * Math.random() * 3.4, ph: Math.random() * 30 };
  }
  _draw2D(t) {
    const c = this.ctx; c.clearRect(0, 0, this.w, this.h); c.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      p.life += p.sp * (1 + this.energy * 1.6) / 60;
      if (p.life >= 1) Object.assign(p, this._seed2D(0));
      const L = p.life, e = p.em;
      let x = e.x * this.w + p.sx * e.spread * this.w * (0.22 + L * 0.95) + Math.sin(t * 0.8 + p.ph) * 38 * L;
      let y = e.y * this.h - L * e.rise * this.h;
      const dx = x - this.mouse[0], dy = y - this.mouse[1], dist = Math.hypot(dx, dy);
      if (dist < 170) { const f = (1 - dist / 170) * 70 * (0.3 + L); x += (dx / (dist || 1)) * f; y += (dy / (dist || 1)) * f; }
      const fade = Math.min(1, L / 0.06) * (1 - Math.max(0, (L - 0.55) / 0.45));
      const r = p.sz * (1 - L * 0.55) * (1 + this.energy * 0.9) * 2.2;
      const g = c.createRadialGradient(x, y, 0, x, y, r * 2);
      const col = L < 0.3 ? '255,210,140' : L < 0.6 ? '250,140,55' : '190,50,20';
      g.addColorStop(0, `rgba(${col},${0.85 * fade})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
}

// Création WebGL séparée (import dynamique d'OGL) pour que la version 2D reste disponible partout.
export async function createEmbers(canvas, opts = {}) {
  if (opts.webgl !== false) {
    try {
      const { Renderer, Program, Geometry, Mesh } = await import('./vendor/ogl.mjs');
      const em = Object.create(Embers.prototype);
      Object.assign(em, { canvas, opts: Object.assign({ count: 600, emitters: [{ x: 0.5, y: 1.02, spread: 1.2, rise: 1.1 }], size: 1, share: 0.5 }, opts), energy: 0, target: 0, running: false, visible: true, t0: performance.now(), mouse: [-9999, -9999] });
      const renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.75), depth: false });
      const gl = renderer.gl;
      if (!gl) throw new Error('no webgl');
      gl.clearColor(0, 0, 0, 0);
      const n = em.opts.count;
      const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), emit = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random();
        emit[i] = em.opts.emitters.length > 1 && Math.random() < em.opts.share ? 1 : 0;
      }
      const geometry = new Geometry(gl, { position: { size: 3, data: pos }, aSeed: { size: 4, data: seed }, aEmit: { size: 1, data: emit } });
      const program = new Program(gl, {
        vertex: VERT, fragment: FRAG, transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uEnergy: { value: 0 }, uSize: { value: em.opts.size }, uDpr: { value: 1 }, uRes: { value: [1, 1] }, uMouse: { value: [-9999, -9999] }, uE0: { value: [0.5, 1, 1, 1] }, uE1: { value: [0.5, 1, 1, 1] } },
      });
      program.setBlendFunc(gl.ONE, gl.ONE);
      const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
      Object.assign(em, { gl, renderer, program, mesh });
      em._uniformsEmit();
      em._resize = em._resize.bind(em); em._loop = em._loop.bind(em);
      em.ro = new ResizeObserver(em._resize); em.ro.observe(canvas.parentElement || canvas);
      em.io = new IntersectionObserver((en) => { em.visible = en[0].isIntersecting; if (em.visible && em.running) em._kick(); }, { rootMargin: '100px' });
      em.io.observe(canvas);
      em._onMove = (e) => { const r = canvas.getBoundingClientRect(); em.mouse = [e.clientX - r.left, e.clientY - r.top]; };
      window.addEventListener('pointermove', em._onMove, { passive: true });
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); em.stop(); });
      em._resize();
      em.kind = 'webgl';
      return em;
    } catch (e) {
      console.warn('Braises : passage en canvas 2D', e);
    }
  }
  const em = new Embers(canvas, Object.assign({}, opts, { webgl: false }));
  em.kind = '2d';
  return em;
}

// Chapter 6: other ways to find a touch, and how a screen touches back.
// Infrared: a frame of LEDs and light sensors; a finger blocks beams.
// Surface acoustic wave (SAW): ultrasound ripples cross the glass; a finger absorbs some, and the time of the
// dip in the received signal gives the position. Both are drawn as simple cartoons (the SAW sweep is slowed down
// and its reflector arrays are not drawn). Haptics: a small motor in the phone gives a click when you touch.
// The shake in slow motion is much slower than a real actuator, which resonates at roughly 150 to 250 Hz.
import { THREE, M, COL, roundedSlab, finger, canvasTexture, clamp, smooth, lerp, heatCss } from '../screen.js';

const W = 4.6, D = 3.4, NX = 14, NZ = 10, FR = 0.26;
const MODES = {
  ir: { n: 'Infrared grid', view: { pos: [3.2, 5.4, 4.6], target: [0, 0, 0] } },
  saw: { n: 'Sound waves', view: { pos: [3, 5, 5.8], target: [0, 0.6, -0.4] } },
  haptic: { n: 'Haptic click', view: { pos: [2.6, 4.2, 5.2], target: [0, 0.3, 0] } },
};
const CLICKS = { click: { n: 'Click', dur: 0.7, tau: 0.16, f: 5, amp: 0.34, say: 'One sharp, short pulse: it feels like a button clicking.' }, tick: { n: 'Soft tick', dur: 0.55, tau: 0.1, f: 6, amp: 0.16, say: 'A lighter pulse, used for scrolling through a picker.' }, buzz: { n: 'Buzz', dur: 1.8, tau: 3, f: 5, amp: 0.3, say: 'A longer shake, used for alerts.' } };

export default {
  id: 'other',
  short: 'Other methods, and haptics',
  title: 'Light, sound and a touch back',
  subtitle: 'Infrared beams, ripples of ultrasound, and the click you feel.',
  view: MODES.ir.view,
  learn: `<p>Capacitive sensing is not the only trick. An <b>infrared</b> screen has a frame of LEDs along two edges and light sensors on the opposite edges. The beams make an invisible net across the glass. A finger or a stylus <b>blocks</b> one beam in each direction, which gives x and y. It works with any object and on very large screens, so you find it in kiosks and classroom boards.</p>
    <p>A <b>surface acoustic wave</b> screen sends ultrasound ripples along the surface of the glass. A finger <b>absorbs</b> a little of the wave. The chip listens for a dip in the received signal and uses <b>when</b> it arrives to tell where the finger is. How much it dips even says how hard you press.</p>
    <p>Then the screen <b>touches back</b>. A small actuator in the phone, often a mass on a spring driven by a coil, shakes for a moment when you touch, so glass feels like it clicked. This is <b>haptic feedback</b>.</p>
    <p class="tip"><b>Try it:</b> pick a mode and move the finger. For haptics, press <b>Click</b>, <b>Soft tick</b> and <b>Buzz</b>.</p>`,
  terms: [
    { t: 'Infrared touch frame', d: 'LEDs and light sensors around the edge. A touch blocks beams.' },
    { t: 'Surface acoustic wave', d: 'An ultrasound ripple that travels along the surface of the glass.' },
    { t: 'Haptics', d: 'Feedback you feel, such as a small vibration when you press the screen.' },
    { t: 'Linear resonant actuator', d: 'A mass on a spring that a coil shakes at its natural frequency. Common in phones.' },
  ],
  defaults: { mode: 'ir', wander: true, fx: 0.6, fz: 0.4, press: 0.6 },
  onChange(s, key) { if (key === 'fx' || key === 'fz') s.wander = false; },
  controls: [
    { key: 'mode', type: 'seg', label: 'Method', options: Object.entries(MODES).map(([v, m]) => ({ v, label: m.n })) },
    { key: 'ev', type: 'buttons', label: 'Make a haptic pulse', items: Object.entries(CLICKS).map(([id, c]) => ({ label: c.n, act: (st, inst) => { st.mode = 'haptic'; inst.fire(id); } })) },
    { key: 'wander', type: 'toggle', label: 'Wander (finger moves by itself)' },
    { key: 'fx', type: 'range', label: 'Finger across', min: -2, max: 2, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'fz', type: 'range', label: 'Finger up and down', min: -1.4, max: 1.4, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'press', type: 'range', label: 'Press (sound waves)', min: 0.15, max: 1, step: 0.01, fmt: (v) => (v < 0.4 ? 'Light' : v < 0.75 ? 'Firm' : 'Hard') },
  ],
  quiz: [
    { q: 'How does an infrared touch frame find your finger?', options: ['It blocks a beam in each direction', 'It reads a fingerprint', 'It senses heat only', 'It weighs the glass'], answer: 0, why: 'Beams run across the screen both ways. The one blocked in each direction gives x and y.' },
    { q: 'On a surface acoustic wave screen, what tells the chip where you touched?', options: ['The colour of the dip', 'The time at which the received wave dips', 'The temperature', 'A tiny camera'], answer: 1, why: 'The wave takes a known time to reach each position, so the time of the dip gives the position.' },
    { q: 'What makes a phone screen seem to click when you touch it?', options: ['A tiny spring in the glass', 'An actuator that gives a short shake', 'Magnets', 'The sound of the speaker'], answer: 1, why: 'A small actuator inside shakes for a moment. The glass does not really move, but your finger feels the pulse.' },
  ],
  reel: [
    { ms: 5000, caption: 'Infrared screens use a net of invisible light beams. A finger breaks two.', set: { mode: 'ir', wander: true }, spin: 0 },
    { ms: 5000, caption: 'And the screen touches back: a tiny motor gives a click.', set: { mode: 'haptic' }, act: (st, inst) => inst.fire('click'), spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const frame = roundedSlab(W + 0.6, D + 0.6, 0.12, 0.2, M.plastic(0x181c27)); root.add(frame);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0x0a0e1a })); screen.rotation.x = -Math.PI / 2; screen.position.y = 0.13; root.add(screen);
    const fing = finger(1.0); root.add(fing);
    // ---- infrared
    const ir = new THREE.Group(); root.add(ir);
    const bx = [], bz = [];
    const ledMat = M.glow(COL.coral), pdMat = M.glow(COL.lime);
    for (let i = 0; i < NX; i++) {
      const x = -W / 2 + (i + 0.5) * W / NX;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, D), new THREE.MeshBasicMaterial({ color: COL.coral, transparent: true, opacity: 0.75, toneMapped: false })); b.position.set(x, 0.2, 0); ir.add(b); bx.push({ b, x });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), ledMat); led.position.set(x, 0.17, D / 2 + 0.12); ir.add(led);
      const pd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), pdMat); pd.position.set(x, 0.17, -D / 2 - 0.12); ir.add(pd);
    }
    for (let j = 0; j < NZ; j++) {
      const z = -D / 2 + (j + 0.5) * D / NZ;
      const b = new THREE.Mesh(new THREE.BoxGeometry(W, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: COL.coral, transparent: true, opacity: 0.75, toneMapped: false })); b.position.set(0, 0.22, z); ir.add(b); bz.push({ b, z });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), ledMat); led.position.set(-W / 2 - 0.12, 0.17, z); ir.add(led);
      const pd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), pdMat); pd.position.set(W / 2 + 0.12, 0.17, z); ir.add(pd);
    }
    // ---- sound waves
    const saw = new THREE.Group(); root.add(saw);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.16, D), new THREE.MeshBasicMaterial({ color: COL.cyan, transparent: true, opacity: 0.55, side: THREE.DoubleSide, toneMapped: false })); strip.rotation.x = -Math.PI / 2; strip.position.y = 0.16; saw.add(strip);
    const trace = canvasTexture(512, 160, () => {});
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 160 / 512), new THREE.MeshBasicMaterial({ map: trace.tex, transparent: true, toneMapped: false })); gp.position.set(0, 1.5, -D / 2 - 0.9); saw.add(gp);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), ledMat); tr.position.set(-W / 2 - 0.12, 0.17, D / 2); saw.add(tr);
    const rc = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), pdMat); rc.position.set(W / 2 + 0.12, 0.17, D / 2); saw.add(rc);
    // ---- haptics
    const hap = new THREE.Group(); root.add(hap);
    const ph = new THREE.Group(); hap.add(ph);
    const hbody = roundedSlab(2.0, 3.6, 0.5, 0.3, M.clear(0x8ef0ff, 0.22)); hbody.position.y = 0.15; ph.add(hbody);
    const hedge = new THREE.LineSegments(new THREE.EdgesGeometry(hbody.geometry), new THREE.LineBasicMaterial({ color: 0x8ef0ff, transparent: true, opacity: 0.5 })); hbody.add(hedge);
    const houseL = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 0.5), M.clear(0xffffff, 0.15)); houseL.position.set(0, 0.45, -1.0); ph.add(houseL);
    const mass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.38), M.metal(0xd8dde8)); mass.position.set(0, 0.45, -1.0); ph.add(mass);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 20), M.glow(COL.amber)); coil.rotation.y = Math.PI / 2; coil.position.set(0, 0.45, -1.0); ph.add(coil);
    const spr = [-1, 1].map((sgn) => { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), M.glow(COL.violet)); sp.rotation.z = Math.PI / 2; ph.add(sp); return sp; });
    const hw = canvasTexture(512, 160, () => {});
    const hwp = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4 * 160 / 512), new THREE.MeshBasicMaterial({ map: hw.tex, transparent: true, toneMapped: false })); hwp.position.set(0, 1.6, -2.5); hap.add(hwp);
    stage.label('Mass on springs', [0, 0.85, -1.0], ph, 'hot');
    const hf = finger(1.0); hf.visible = false; hap.add(hf);
    let tt = 0, ev = null, lastMode = null, saw_t = 0, hx = 0;
    const pos = { x: 0, z: 0 };
    const env = (e, a) => (e ? Math.exp(-a / e.C.tau) * Math.min(1, a / 0.02) : 0);
    return {
      fire(id) { ev = { C: CLICKS[id], id, t0: tt }; },
      update(dt, st, time) {
        tt += dt;
        if (st.mode !== lastMode) { lastMode = st.mode; stage.setView(MODES[st.mode].view.pos, MODES[st.mode].view.target, 0.8); }
        if (st.wander) { pos.x = Math.sin(time * 0.6) * W * 0.36; pos.z = Math.sin(time * 0.43 + 1) * D * 0.35; } else { pos.x = st.fx; pos.z = st.fz; }
        const m = st.mode;
        ir.visible = m === 'ir'; saw.visible = m === 'saw'; hap.visible = m === 'haptic'; frame.visible = screen.visible = m !== 'haptic';
        fing.visible = m !== 'haptic'; fing.position.set(pos.x, 0.14, pos.z);
        if (m === 'ir') {
          bx.forEach(({ b, x }) => { const hit = Math.abs(x - pos.x) < FR; b.material.color.setHex(hit ? 0x333a4d : COL.coral); b.material.opacity = hit ? 0.9 : 0.7; });
          bz.forEach(({ b, z }) => { const hit = Math.abs(z - pos.z) < FR; b.material.color.setHex(hit ? 0x333a4d : COL.coral); b.material.opacity = hit ? 0.9 : 0.7; });
        } else if (m === 'saw') {
          const cyc = (time % 6) / 6, axis = cyc < 0.5 ? 'x' : 'z', k = axis === 'x' ? cyc * 2 : (cyc - 0.5) * 2;
          saw_t = k;
          strip.rotation.z = axis === 'x' ? 0 : Math.PI / 2;
          strip.position.set(axis === 'x' ? -W / 2 + k * W : 0, 0.16, axis === 'z' ? -D / 2 + k * D : 0);
          strip.scale.y = axis === 'x' ? 1 : W / D;
          const g = trace.canvas.getContext('2d'), w = 512, h = 160;
          g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(7,8,12,.8)'; g.fillRect(0, 0, w, h);
          g.strokeStyle = 'rgba(255,255,255,.12)'; g.strokeRect(0.5, 0.5, w - 1, h - 1);
          const pk = axis === 'x' ? (pos.x + W / 2) / W : (pos.z + D / 2) / D;
          const sample = (u) => 1 - st.press * 0.7 * Math.exp(-(((u - pk) / 0.035) ** 2));
          g.strokeStyle = axis === 'x' ? '#8ef0ff' : '#ffb547'; g.lineWidth = 2; g.beginPath();
          for (let px = 0; px <= k * w; px++) { const u = px / w, y = h * 0.88 - sample(u) * h * 0.7 + Math.sin(u * 190) * 4 * sample(u); px ? g.lineTo(px, y) : g.moveTo(px, y); }
          g.stroke();
          g.fillStyle = '#a8aebf'; g.font = '16px sans-serif'; g.fillText(axis === 'x' ? 'Received signal, sweep across: time →' : 'Received signal, sweep up and down: time →', 10, 22);
          trace.tex.needsUpdate = true;
        } else {
          const a = ev ? tt - ev.t0 : 99;
          const live = ev && a < ev.C.dur;
          const e = live ? env(ev, a) : 0, x = live ? ev.C.amp * e * Math.sin(a * ev.C.f * Math.PI * 2) : 0;
          hx = x;
          mass.position.x = x * 1.6; coil.position.x = x * 1.6;
          ph.position.x = -x * 0.35;
          spr.forEach((sp, i) => { const sgn = i ? 1 : -1, a0 = sgn * 0.8, a1 = mass.position.x + sgn * 0.3, len = Math.abs(a1 - a0); sp.scale.y = Math.max(0.05, len); sp.position.set((a0 + a1) / 2, 0.45, -1.0); });
          hf.visible = true; hf.position.set(0, 0.67 + (live && ev.id !== 'buzz' ? -0.02 : 0), 1.0);
          const g = hw.canvas.getContext('2d'), w = 512, h = 160;
          g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(7,8,12,.8)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.12)'; g.strokeRect(0.5, 0.5, w - 1, h - 1);
          g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
          if (ev) { g.strokeStyle = '#ffb547'; g.lineWidth = 2; g.beginPath(); const T = ev.C.dur; for (let px = 0; px <= w; px++) { const t = px / w * 2; const ee = t < Math.min(a, T) ? Math.exp(-t / ev.C.tau) * Math.min(1, t / 0.02) : 0; const y = h / 2 - ee * Math.sin(t * ev.C.f * Math.PI * 2) * h * 0.4 / 1; (px ? g.lineTo(px, y) : g.moveTo(px, y)); } g.stroke(); }
          g.fillStyle = '#a8aebf'; g.font = '16px sans-serif'; g.fillText('Mass position over time (slow motion)', 10, 22);
          hw.tex.needsUpdate = true;
        }
      },
      readout(st) {
        if (st.mode === 'ir') {
          const bi = bx.filter((o) => Math.abs(o.x - pos.x) < FR).map((o) => bx.indexOf(o) + 1), bj = bz.filter((o) => Math.abs(o.z - pos.z) < FR).map((o) => bz.indexOf(o) + 1);
          return `<div class="big">${bi.length && bj.length ? 'Touch found' : 'Beams clear'}</div><p class="r-say">One beam blocked in each direction gives the position. Any object that blocks light works, gloved or not. The beams also fire a hair above the glass, so a near miss can count.</p>
            <div class="row"><span>Beams blocked, across</span><b>${bi.join(', ') || 'none'} of ${NX}</b></div><div class="row"><span>Beams blocked, up and down</span><b>${bj.join(', ') || 'none'} of ${NZ}</b></div>`;
        }
        if (st.mode === 'saw') {
          return `<div class="big">Listening for a dip</div><p class="r-say">The wave crosses the glass at a known speed, so the time of the dip gives the position. A harder press absorbs more, so the dip is deeper. The sweep is slowed a great deal.</p>
            <div class="row"><span>Sweep progress</span><b>${(saw_t * 100).toFixed(0)}%</b></div><div class="row"><span>Dip depth</span><b>${(st.press * 70).toFixed(0)}% of the signal</b></div>`;
        }
        const live = ev && tt - ev.t0 < ev.C.dur;
        return `<div class="big">${ev ? ev.C.n : 'Press a pulse button'}</div><p class="r-say">${ev ? ev.C.say : 'A small mass on springs inside the phone is shaken by a coil.'} Shown in slow motion; a real one shakes roughly 150 to 250 times a second.</p>
          <div class="row"><span>Mass moving</span><b>${live ? 'Yes' : 'At rest'}</b></div>`;
      },
    };
  },
};

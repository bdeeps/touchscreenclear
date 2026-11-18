// Chapter 1: the layer stack. A phone screen is a sandwich: strengthened cover glass on top, a clear adhesive,
// a thin touch sensor (a grid of transparent electrodes) and the display that makes the light.
// On many phones the sensor is built into the display panel itself ("on-cell" or "in-cell"). It is drawn
// as its own layer here so you can see it. The layers are not to scale, and thicknesses are typical ranges.
import { THREE, M, box, COL, SCR, roundedSlab, finger, electrodeGrid, canvasTexture, smooth, lerp } from '../screen.js';

const LAYERS = [
  { id: 'display', name: 'Display', what: 'The part that makes light. An OLED panel has a tiny coloured light in every sub-pixel. An LCD uses a backlight and a layer of liquid crystal as shutters.', mm: 'about 0.3 to 0.7 mm' },
  { id: 'sensor', name: 'Touch sensor', what: 'Two sets of crossing electrodes, one set of rows and one of columns, made of a clear conductor such as indium tin oxide or a fine metal mesh. It senses your finger but does not light anything.', mm: 'about 0.02 to 0.15 mm' },
  { id: 'glue', name: 'Clear adhesive', what: 'An optically clear glue. It fills the air gap so there is no reflection between layers, and it keeps the stack in one piece.', mm: 'about 0.05 to 0.2 mm' },
  { id: 'glass', name: 'Cover glass', what: 'Chemically strengthened glass (for example Gorilla Glass). It protects the stack and is where your finger lands. Electric fields pass through it, which is why touch works through glass.', mm: 'about 0.4 to 0.8 mm' },
];
const GAP = 0.9;

export default {
  id: 'stack',
  short: 'The layers',
  title: 'A sandwich of glass',
  subtitle: 'Cover glass, glue, a sensor grid and a display. Pull them apart.',
  view: { pos: [4.6, 4.2, 6.2], target: [0, 0.9, 0] },
  learn: `<p>A phone screen is not one thing. It is a stack of thin, clear layers glued together. On top is <b>cover glass</b>, strengthened so it survives pockets and keys. Under it is a clear <b>adhesive</b>, then the <b>touch sensor</b>, and at the bottom the <b>display</b> that makes the light.</p>
    <p>The sensor is a grid of <b>transparent electrodes</b>: rows in one layer, columns in the next, crossing like a net. They are made of a material that conducts electricity and still lets light through (indium tin oxide, or a mesh of lines too thin to see). The whole stack is only about <b>one to two millimetres</b> thick.</p>
    <p>On many phones the sensor is built into the display panel itself, called <b>on-cell</b> or <b>in-cell</b>, to save thickness. The idea is the same.</p>
    <p class="tip"><b>Try it:</b> drag <b>Pull apart</b> to separate the layers, pick one to read about it, and turn on <b>Touch</b> to see which part reacts to a finger.</p>
    <p class="note">Not to scale: the layers are drawn much thicker than they are. Thicknesses are typical ranges and differ from phone to phone.</p>`,
  terms: [
    { t: 'Cover glass', d: 'The strengthened glass on top. Your finger touches this, not the sensor.' },
    { t: 'Electrode', d: 'A thin strip of conductor. The sensor is a grid of them, rows crossing columns.' },
    { t: 'Transparent conductor', d: 'A material, such as indium tin oxide, that carries current and lets light through.' },
    { t: 'In-cell / on-cell', d: 'Touch sensing built into the display panel itself instead of a separate layer.' },
  ],
  defaults: { explode: 0.7, layer: 'sensor', touch: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Pull apart', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.05 ? 'Together' : Math.round(v * 100) + '%') },
    { key: 'layer', type: 'seg', label: 'Read about', options: [{ v: 'glass', label: 'Glass' }, { v: 'glue', label: 'Glue' }, { v: 'sensor', label: 'Sensor' }, { v: 'display', label: 'Display' }] },
    { key: 'touch', type: 'toggle', label: 'Touch with a finger' },
  ],
  quiz: [
    { q: 'What is the touch sensor in a phone screen made of?', options: ['A layer of rubber', 'A grid of transparent electrodes', 'A tiny camera', 'The glass itself'], answer: 1, why: 'Rows and columns of a clear conductor, like indium tin oxide or fine metal mesh, form a net that you cannot see.' },
    { q: 'Why can a screen sense your finger through glass?', options: ['The glass is full of wires', 'Electric fields reach through glass', 'The glass bends a lot', 'It uses sound'], answer: 1, why: 'Glass is an insulator, so it lets the electric field of the electrodes pass through and reach your finger.' },
    { q: 'Which layer is closest to your finger?', options: ['The display', 'The sensor', 'The cover glass', 'The adhesive'], answer: 2, why: 'The strengthened cover glass is on top. Everything else is under it.' },
  ],
  reel: [
    { ms: 5200, caption: 'A touchscreen is a sandwich of glass, glue, a sensor and a display.', set: { explode: 0, layer: 'glass', touch: false }, anim: { explode: [0, 1] }, view: { pos: [4.6, 4.2, 6.2], target: [0, 1, 0] }, spin: 0.35 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const W = SCR.w + 0.5, D = SCR.d + 0.6;
    const mk = (i) => { const g = new THREE.Group(); root.add(g); g.userData.i = i; return g; };
    const L = {}; LAYERS.forEach((l, i) => { L[l.id] = mk(i); });
    // display: a coloured picture made of pixels
    const pix = canvasTexture(180, 312, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a3b8f'); gr.addColorStop(0.5, '#7a4bd8'); gr.addColorStop(1, '#ff7a59');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w * 0.5, h * 0.4, 36, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h);
    });
    const dBody = roundedSlab(W, D, 0.28, 0.35, M.plastic(0x181c27)); L.display.add(dBody);
    const dFace = new THREE.Mesh(new THREE.PlaneGeometry(SCR.w, SCR.d), new THREE.MeshBasicMaterial({ map: pix.tex, toneMapped: false })); dFace.rotation.x = -Math.PI / 2; dFace.position.y = 0.285; L.display.add(dFace);
    // sensor: a clear film carrying the electrode grid
    const film = roundedSlab(W, D, 0.06, 0.35, M.clear(0x8ef0ff, 0.12)); L.sensor.add(film);
    const grid = electrodeGrid(L.sensor, { y: 0.07, opacity: 0.95 });
    // glue + glass
    const glue = roundedSlab(W, D, 0.1, 0.35, M.clear(0xffb547, 0.2)); L.glue.add(glue);
    const glass = roundedSlab(W, D, 0.3, 0.35, M.clear(0xcfe8ff, 0.2, { roughness: 0.05 })); L.glass.add(glass);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5 })); glass.add(edge);
    LAYERS.forEach((l) => stage.label(l.name, [W / 2 + 0.1, 0.15, 0.3], L[l.id], 'lbl-layer'));
    const fing = finger(1.15); root.add(fing);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 40), M.glow(COL.amber, { side: THREE.DoubleSide, transparent: true })); ring.rotation.x = -Math.PI / 2; root.add(ring);
    const base = [0, 0.4, 0.55, 0.9];            // stacked heights, bottom to top (not to scale)
    const mats = { display: [dBody.material], sensor: [film.material], glue: [glue.material], glass: [glass.material] };
    const baseOp = { display: 1, sensor: 0.12, glue: 0.2, glass: 0.2 };
    let kx = 0;
    return {
      update(dt, st, time) {
        kx = smooth(st.explode);
        LAYERS.forEach((l, i) => {
          const order = LAYERS.length - 1 - i;              // glass on top
          const stackY = [0, 0.3, 0.38, 0.5][i], flatY = i * GAP * 1.15;
          L[l.id].position.y = lerp(stackY * 0.9, flatY, kx);
          const on = st.layer === l.id;
          mats[l.id].forEach((m) => { if (m.transparent) m.opacity = on ? Math.min(0.85, baseOp[l.id] * 2.4) : baseOp[l.id] * 0.8; m.emissive?.setHex(on ? 0x112233 : 0); });
          L[l.id].children.forEach((c) => { if (c.isCSS2DObject) c.element.classList.toggle('hot', on); });
        });
        const topY = L.glass.position.y + 0.3;
        const fx = Math.sin(time * 1.2) * 0.25, fz = 0.6 + Math.cos(time * 0.9) * 0.35;
        const hov = st.touch ? 0.02 + (Math.sin(time * 3) * 0.5 + 0.5) * 0.06 : 0.9;
        fing.position.set(fx, topY + hov + (st.touch ? 0 : 0.6), fz); fing.visible = true;
        ring.visible = st.touch; ring.position.set(fx, topY + 0.02, fz);
        ring.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(time * 3));
        // the electrodes near the finger light up
        const sy = L.sensor.position.y;
        grid.tx.forEach((m) => { const d = Math.abs(m.position.z - fz); m.material.opacity = st.touch ? 0.35 + 0.65 * Math.exp(-d * d * 6) : 0.55; });
        grid.rx.forEach((m) => { const d = Math.abs(m.position.x - fx); m.material.opacity = st.touch ? 0.35 + 0.65 * Math.exp(-d * d * 6) : 0.55; });
      },
      readout(st) {
        const l = LAYERS.find((x) => x.id === st.layer);
        return `<div class="big">${l.name}</div><p class="r-say">${l.what}</p><div class="row"><span>Typical thickness</span><b>${l.mm}</b></div><div class="row"><span>Whole stack</span><b>about 1 to 2 mm</b></div>`;
      },
    };
  },
};

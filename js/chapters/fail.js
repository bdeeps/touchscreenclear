// Chapter 4: why gloves, plastic and water cause trouble. A side view of the electrodes under the glass.
// The field between a row and a column bulges up through the glass. A bare fingertip is a conductor close to
// that field and steals some of it. A glove adds distance, plastic is not a conductor, and water is a
// conductor that spreads and bridges. The signal below is a teaching curve: strong when close, falling fast
// with distance. The real numbers depend on the controller, the glass thickness and the gain settings.
import { THREE, M, COL, finger, sphere, clamp, smooth, lerp } from '../screen.js';

// gap: distance of the conductor above the glass (model units), cond: how well it carries charge (0 to 1)
const THINGS = {
  finger: { n: 'Bare finger', gap: 0.0, cond: 1, say: 'Skin is a conductor and is touching the glass. Strong signal.' },
  thin: { n: 'Thin glove', gap: 0.35, cond: 1, say: 'The fingertip inside still conducts, but fabric holds it a little further from the glass. Weaker signal.' },
  thick: { n: 'Thick glove', gap: 1.1, cond: 1, say: 'Too far away. The field barely feels the finger, so there is no touch.' },
  thread: { n: 'Touchscreen glove', gap: 0.35, cond: 1, say: 'Conductive thread in the fingertip carries the finger’s charge to the glass. Works.' },
  plastic: { n: 'Plastic stick', gap: 0.0, cond: 0.03, say: 'Plastic is an insulator, so it takes almost no field. Needs a conductive tip.' },
};
const N = 7;   // electrodes drawn
const THR = 0.3;

export default {
  id: 'fail',
  short: 'Gloves and water',
  title: 'Why gloves and wet screens fail',
  subtitle: 'The sensor needs a conductor close to its field. Gloves and plastic do not give it one.',
  view: { pos: [0, 2.6, 9.4], target: [0, 1.1, 0] },
  learn: `<p>A capacitive screen does not feel pressure. It feels a <b>conductor</b> that is <b>close</b> to the electrodes. A bare fingertip is both. A normal wool <b>glove</b> keeps the finger a few millimetres away, and the field falls off quickly with distance, so the signal drops below the touch threshold. A <b>plastic stick</b> is not a conductor at all.</p>
    <p>Gloves made for touchscreens have <b>conductive thread</b> in the fingertips. Many phones also have a <b>glove mode</b> that raises the sensitivity, at the cost of more false touches.</p>
    <p><b>Water</b> is a conductor too. A drop on the glass can add its own faint signal (a <b>ghost touch</b>), and a film of water spreads your finger's effect over a wider area, so the position is less sure. Controllers filter for this, and are better at it every year, but a wet screen is still the hardest case.</p>
    <p class="tip"><b>Try it:</b> go through the objects and watch the signal bar. Turn on <b>Water</b> and <b>Glove mode</b> and see what changes.</p>
    <p class="note">The curve is a simple model of the idea, not a measurement.</p>`,
  terms: [
    { t: 'Conductor', d: 'A material that lets electric charge move, such as skin, water or metal.' },
    { t: 'Insulator', d: 'A material that does not, such as glass, plastic or dry wool.' },
    { t: 'Ghost touch', d: 'A touch reported when nothing is touching, often because of water or electrical noise.' },
    { t: 'Glove mode', d: 'A setting that makes the sensor more sensitive so it can feel a finger through thin cloth.' },
  ],
  defaults: { thing: 'finger', water: false, glove: false },
  controls: [
    { key: 'thing', type: 'seg', label: 'What touches', options: Object.entries(THINGS).map(([v, o]) => ({ v, label: o.n })) },
    { key: 'water', type: 'toggle', label: 'Water drops on the glass' },
    { key: 'glove', type: 'toggle', label: 'Glove mode (more sensitive)' },
  ],
  quiz: [
    { q: 'Why does a thick wool glove stop a touchscreen working?', options: ['It is too heavy', 'It keeps the finger too far from the electrodes', 'It blocks light', 'It is too warm'], answer: 1, why: 'The field falls off fast with distance. A thick glove puts the finger outside the field.' },
    { q: 'What do gloves made for touchscreens have in the fingertips?', options: ['Magnets', 'Conductive thread', 'Tiny batteries', 'Glass'], answer: 1, why: 'The conductive thread carries the charge of your finger through the fabric to the glass.' },
    { q: 'Why can water confuse a capacitive screen?', options: ['It is a conductor that can add its own signal and spread yours', 'It cools the glass', 'It changes the colours', 'It is heavy'], answer: 0, why: 'Water conducts, so drops can look like touches and a wet film makes a finger’s blob wider and fuzzier.' },
  ],
  reel: [
    { ms: 5400, caption: 'A thick glove keeps your finger out of the field, so nothing happens.', set: { thing: 'thick', water: false, glove: false }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const W = 8.2;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, 2.2), M.clear(0xcfe8ff, 0.2)); glass.position.y = -0.2; root.add(glass);
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, 2.2), M.plastic(0x181c27)); body.position.y = -1.1; root.add(body);
    const rows = [], cols = [], arcs = [], pull = [];
    const sp = W / (N + 1);
    for (let i = 0; i < N; i++) {
      const x = -W / 2 + sp * (i + 1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(sp * 0.42, 0.06, 1.5), M.glow(i % 2 ? COL.cyan : COL.amber)); m.position.set(x, -0.44, 0); root.add(m); (i % 2 ? cols : rows).push(m);
      if (i < N - 1) {
        const x2 = x + sp, mid = (x + x2) / 2;
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x + sp * 0.2, -0.42, 0), new THREE.Vector3(mid, 1.35, 0), new THREE.Vector3(x2 - sp * 0.2, -0.42, 0));
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, toneMapped: false });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.018, 6), mat); root.add(tube); arcs.push({ tube, x: mid, mat });
      }
    }
    const thing = new THREE.Group(); root.add(thing);
    const fing = finger(1.4); fing.rotation.x = 0.0; thing.add(fing);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 14), M.plastic(0x5a6adf)); stick.position.y = 1.5; thing.add(stick);
    const glove = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.7, 8, 20), M.matte(0x5b6f8a)); thing.add(glove);
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), M.glow(COL.lime)); wire.rotation.x = Math.PI / 2; thing.add(wire);
    const drops = [];
    [-2.6, -0.9, 2.2, 3.1].forEach((x, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2 + (i % 2) * 0.06, 20, 12), M.clear(0x6fb8ff, 0.55, { roughness: 0.05 })); d.scale.y = 0.45; d.position.set(x, 0.05, 0.2 * (i % 2)); root.add(d); drops.push(d); });
    const film = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.03, 32), M.clear(0x6fb8ff, 0.35)); film.position.y = 0.02; root.add(film);
    stage.label('Cover glass', [-W / 2 + 0.1, 0.1, 1.2], root);
    stage.label('Electrodes: rows and columns', [-W / 2 + 0.1, -0.6, 1.2], root);
    let sig = 0, ghost = 0, wide = 1, k = 0, tx = 0;
    const compute = (st) => {
      const T = THINGS[st.thing];
      const base = Math.max(T.cond, 0.0) / (1 + (T.gap / 0.5) ** 2.2);
      const gain = st.glove ? 3.2 : 1;
      wide = st.water ? 1.7 : 1;
      sig = clamp(base * gain * (st.water ? 0.9 : 1), 0, 1.5);
      ghost = (st.water ? 0.2 : 0) * gain * 1.1;
    };
    return {
      update(dt, st, time) {
        compute(st);
        const T = THINGS[st.thing];
        k += (1 - k) * (1 - Math.exp(-6 * dt));
        tx = Math.sin(time * 0.5) * 0.6;
        const topY = 0.0;
        const press = (Math.sin(time * 2) * 0.5 + 0.5) * 0.1;
        thing.position.set(tx, T.gap + press * 0.4, 0);
        fing.visible = st.thing === 'finger' || st.thing === 'thin' || st.thing === 'thick' || st.thing === 'thread';
        glove.visible = st.thing === 'thin' || st.thing === 'thick' || st.thing === 'thread';
        glove.material.color.setHex(st.thing === 'thread' ? 0x4a5a74 : 0x5b6f8a);
        glove.position.y = 0.42 + 0.0; glove.rotation.x = 0.55; glove.position.z = 0.0;
        glove.scale.setScalar(st.thing === 'thick' ? 1.6 : st.thing === 'thin' ? 1.1 : 1.15);
        wire.visible = st.thing === 'thread'; wire.position.y = 0.05;
        // keep the glove from covering the whole tip: the glove sits around the finger and its tip is the contact
        glove.position.y = 0.35 + (st.thing === 'thick' ? 0.0 : 0.0);
        glove.position.set(0, (st.thing === 'thick' ? 0.9 : 0.55), 0.35);
        stick.visible = st.thing === 'plastic'; stick.rotation.x = 0.55; stick.position.set(0, 1.25, 0.55);
        drops.forEach((d) => { d.visible = st.water; });
        film.visible = st.water; film.position.x = tx; film.scale.set(1, 1, 0.7);
        arcs.forEach((a) => {
          const d = Math.abs(a.x - tx), g = Math.exp(-(d * d) / (2 * (0.8 * wide) ** 2));
          a.mat.opacity = 0.7 * (1 - 0.8 * clamp(sig, 0, 1) * g);
          a.mat.color.setHex(0xffffff);
          const near = clamp(sig, 0, 1) * g;
          a.mat.color.lerp(new THREE.Color(COL.amber), near);
        });
      },
      readout(st) {
        const T = THINGS[st.thing], seen = sig > THR, ghosted = ghost > THR * 0.6;
        const verdict = seen ? '<span class="ok">Touch detected</span>' : ghosted ? '<span class="no">Ghost touch from water</span>' : '<span class="no">No touch</span>';
        return `<div class="big">${T.n}${st.water ? ' + water' : ''}</div><p class="r-say">${T.say}${st.water ? ' The water adds a faint signal of its own and blurs the position.' : ''}</p>
          <div class="row"><span>Signal</span><b>${(sig * 100).toFixed(0)}%</b></div><div class="meter"><i style="width:${clamp(sig / 1.2 * 100, 0, 100)}%"></i><u style="left:${THR / 1.2 * 100}%"></u></div>
          ${st.water ? `<div class="row"><span>Water ghost signal</span><b>${(ghost * 100).toFixed(0)}%</b></div>` : ''}
          <div class="row"><span>Threshold</span><b>${(THR * 100).toFixed(0)}%</b></div><div class="row"><span>Result</span><b>${verdict}</b></div>`;
      },
    };
  },
};

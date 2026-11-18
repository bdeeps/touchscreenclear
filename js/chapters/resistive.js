// Chapter 5: the resistive screen, for contrast. Two flexible layers coated with a thin resistive film, held
// apart by tiny spacers. A press makes them touch. The controller puts a voltage across one layer, so the
// voltage changes smoothly along it, and reads that voltage from the other layer at the contact. Then it swaps
// roles to read the other axis. It senses pressure and contact, not charge, so a glove or a pen works.
// This is a four-wire layout. Real screens vary (five-wire is common), and the gradient here is idealised.
import { THREE, M, COL, SCR, roundedSlab, finger, clamp, smooth, lerp } from '../screen.js';

const SEG = 28, WS = 4, DS = 4.6, GAPY = 0.9;

export default {
  id: 'resistive',
  short: 'Resistive, for contrast',
  title: 'The older way: press two layers together',
  subtitle: 'Pressure makes contact, and a voltage divider tells where.',
  view: { pos: [4.6, 3.8, 6.4], target: [0, 0.8, 0] },
  learn: `<p>Before phones used fields, most touchscreens were <b>resistive</b>. The screen has two flexible layers, each coated with a thin film that <b>resists</b> current a little. They are held a hair apart by tiny spacer dots. Press, and the top layer bends down and <b>touches</b> the bottom one at one spot.</p>
    <p>To find <b>where</b>, the controller connects a voltage across the left and right edges of one layer. Along that layer the voltage rises steadily, like a ramp. The other layer touches it at the pressed spot and carries <b>that spot's voltage</b> to the controller. Halfway across reads half the supply. Then it swaps: ramp the other way, read again, and it has x and y.</p>
    <p>Because it works by <b>contact</b>, not by charge, it works with a gloved hand, a fingernail or a pen. The price is softer, less clear surfaces, a need to press, and usually only one or two touches at a time.</p>
    <p class="tip"><b>Try it:</b> move the press point and watch the voltage read-out. Switch between the two measurements to see the ramp turn.</p>`,
  terms: [
    { t: 'Resistive film', d: 'A thin coating that conducts electricity poorly, so that voltage drops steadily along it.' },
    { t: 'Voltage divider', d: 'Two resistances in a row. The voltage in the middle depends on where you tap.' },
    { t: 'Spacer dots', d: 'Tiny insulating bumps that keep the two layers apart until you press.' },
  ],
  defaults: { px: 0.6, pz: -0.5, press: true, axis: 'auto' },
  controls: [
    { key: 'press', type: 'toggle', label: 'Press down' },
    { key: 'px', type: 'range', label: 'Press: across', min: -1.7, max: 1.7, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'pz', type: 'range', label: 'Press: up and down', min: -2, max: 2, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'axis', type: 'seg', label: 'Measuring', options: [{ v: 'auto', label: 'Both in turn' }, { v: 'x', label: 'Across' }, { v: 'z', label: 'Up and down' }] },
  ],
  quiz: [
    { q: 'How does a resistive screen know a touch happened?', options: ['The finger steals a field', 'Two layers are pressed into contact', 'A camera sees it', 'Sound waves are blocked'], answer: 1, why: 'The top layer bends down and touches the bottom layer where you press.' },
    { q: 'Why does a resistive screen work with a gloved hand or a pen?', options: ['It senses contact and pressure, not charge', 'It is bigger', 'It has a camera', 'It is magnetic'], answer: 0, why: 'Anything that presses the layers together makes contact, whether or not it conducts.' },
    { q: 'What is read from the second layer at the contact point?', options: ['Its colour', 'A voltage that depends on where along the first layer it touched', 'The temperature', 'The sound'], answer: 1, why: 'The first layer carries a voltage ramp, and the contact point taps it at one position.' },
  ],
  reel: [
    { ms: 5200, caption: 'Older touchscreens use two layers. Press, and they touch.', set: { press: true, px: -0.8, pz: 0.8, axis: 'x' }, anim: { px: [-0.8, 0.9] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const mkLayer = (colorFn) => {
      const g = new THREE.PlaneGeometry(WS, DS, SEG, SEG); g.rotateX(-Math.PI / 2);
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
      return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    };
    const bottom = mkLayer(), top = mkLayer();
    bottom.position.y = 0; top.position.y = GAPY; root.add(bottom, top);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(WS + 0.2, 0.12, DS + 0.2), M.clear(0xcfe8ff, 0.2)); glass.position.y = -0.12; root.add(glass);
    // spacer dots on the bottom layer
    const spGeo = new THREE.SphereGeometry(0.045, 8, 6), spMat = M.glow(0xffffff);
    for (let i = -3; i <= 3; i++) for (let j = -4; j <= 4; j++) { const d = new THREE.Mesh(spGeo, spMat); d.position.set(i * 0.55, 0.05, j * 0.5); root.add(d); }
    const fing = finger(1.1, { tilt: 0.5 }); root.add(fing);
    const probe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), M.glow(0xffffff)); root.add(probe);
    const wireTop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), M.glow(COL.lime)); root.add(wireTop);
    stage.label('Flexible top layer', [-WS / 2, GAPY + 0.05, DS / 2 + 0.1], root);
    stage.label('Bottom layer on glass', [-WS / 2, 0.05, DS / 2 + 0.1], root);
    const lblV = stage.label('', [0, 0, 0], root, 'hot');
    let phase = 0, meas = 'x', cx = 0, cz = 0;
    const pos0 = top.geometry.attributes.position.array.slice();
    const colorLayer = (mesh, along /* 'x' | 'z' | null */) => {
      const col = mesh.geometry.attributes.color.array, pos = mesh.geometry.attributes.position.array;
      for (let i = 0; i < col.length / 3; i++) {
        let v = 0.18;
        if (along === 'x') v = (pos0[i * 3] / WS + 0.5); else if (along === 'z') v = (pos0[i * 3 + 2] / DS + 0.5);
        const rgb = along ? (v < 0.5 ? [0.1 + v * 0.5, 0.35 + v * 1.2, 0.8] : [0.35 + v * 0.65, 0.65 + (0.5 - Math.abs(v - 0.5)) * 0.2, 0.9 - v * 0.7]) : [0.2, 0.22, 0.3];
        col[i * 3] = rgb[0] * 0.9; col[i * 3 + 1] = rgb[1] * 0.9; col[i * 3 + 2] = rgb[2] * 0.9;
      }
      mesh.geometry.attributes.color.needsUpdate = true;
    };
    return {
      update(dt, st, time) {
        const auto = st.axis === 'auto';
        meas = auto ? (Math.floor(time / 2.2) % 2 ? 'z' : 'x') : st.axis;
        cx = clamp(st.px, -WS / 2 + 0.05, WS / 2 - 0.05); cz = clamp(st.pz, -DS / 2 + 0.05, DS / 2 - 0.05);
        // driven layer carries the ramp: the bottom layer for x, the top layer for z
        colorLayer(bottom, meas === 'x' ? 'x' : null); colorLayer(top, meas === 'z' ? 'z' : null);
        const press = st.press ? 1 : 0;
        const pa = top.geometry.attributes.position.array;
        for (let i = 0; i < pa.length / 3; i++) {
          const dx = pos0[i * 3] - cx, dz = pos0[i * 3 + 2] - cz;
          const dent = press * Math.exp(-(dx * dx + dz * dz) / (2 * 0.55 * 0.55));
          pa[i * 3 + 1] = -dent * GAPY;
        }
        top.geometry.attributes.position.needsUpdate = true;
        const fy = lerp(GAPY + 0.9, GAPY - GAPY * 0.0 + 0.02, press);
        fing.position.set(cx, press ? 0.05 + 0.02 : GAPY + 1.2, cz);
        fing.visible = true;
        probe.visible = !!press; probe.position.set(cx, 0.05, cz);
        wireTop.visible = false;
        lblV.visible = !!press; lblV.position.set(cx + 0.45, 0.5, cz);
        const v = meas === 'x' ? cx / WS + 0.5 : cz / DS + 0.5;
        lblV.element.textContent = `${(v * 3.3).toFixed(2)} V`;
      },
      readout(st) {
        const v = meas === 'x' ? cx / WS + 0.5 : cz / DS + 0.5;
        if (!st.press) return `<div class="big">No contact</div><p class="r-say">The layers are apart, so nothing is read. Press down to touch them together.</p>`;
        return `<div class="big">Measuring ${meas === 'x' ? 'across' : 'up and down'}</div>
          <p class="r-say">${meas === 'x' ? 'A voltage ramp runs across the bottom layer.' : 'A voltage ramp runs up the top layer.'} The other layer taps it at the press and carries that voltage to the chip.</p>
          <div class="row"><span>Supply (example)</span><b>3.3 V</b></div><div class="row"><span>Voltage at contact</span><b>${(v * 3.3).toFixed(2)} V</b></div>
          <div class="row"><span>Fraction of the way</span><b>${(v * 100).toFixed(0)}%</b></div>`;
      },
    };
  },
};

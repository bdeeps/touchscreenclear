// Chapter 2: projected capacitive sensing, as a mutual-capacitance grid scanned row by row.
// The controller drives one row electrode (Tx) with a signal and listens on every column electrode (Rx).
// Where a row crosses a column the two electrodes share a tiny electric field. A finger near that crossing
// takes some of the field and the reading falls. Row by row, the controller builds a picture of the whole
// screen: a heat map of changes. This is a teaching model: real controllers scan far faster, filter noise,
// and use many tricks (self-capacitance scans, frequency hopping) that are not drawn here.
import { THREE, M, box, COL, SCR, roundedSlab, finger, electrodeGrid, heatPlane, touchSignal, nodeX, nodeZ, colOf, rowOf, wanderPath, zeros, clamp, smooth } from '../screen.js';

export default {
  id: 'sense',
  short: 'Sensing a finger',
  title: 'Your finger steals a little field',
  subtitle: 'Rows send, columns listen, and a touch makes one crossing read lower.',
  view: { pos: [4.4, 6.2, 6.4], target: [0, 0, 0.3] },
  learn: `<p>Every crossing of a row and a column is a tiny <b>capacitor</b>: two conductors with a small electric field between them. The controller sends a signal down one row and measures what arrives on each column. That reading is the <b>mutual capacitance</b> at that crossing.</p>
    <p>Your body is a conductor, and it is connected, loosely, to the world around it. When a fingertip comes close to a crossing it <b>takes some of the field</b> for itself. Less of the signal reaches the column, so the reading <b>drops a little</b>. It is a small change, so the controller compares each reading with a stored no-touch baseline.</p>
    <p>One row after the next is driven, and all columns are read each time. After the last row the controller has a full picture: a <b>heat map</b> where touched crossings glow. Then it starts again, dozens or hundreds of times a second.</p>
    <p class="tip"><b>Try it:</b> turn off <b>Wander</b> and slide the finger around. Lift it with <b>Height</b>: the glow gets weaker and wider, then vanishes. Slow the scan to watch one row at a time.</p>`,
  terms: [
    { t: 'Capacitance', d: 'How much electric charge a pair of conductors holds for a given voltage. It depends on their shape, distance and what is between them.' },
    { t: 'Mutual capacitance', d: 'The capacitance between a row electrode and a column electrode. A finger nearby makes it drop.' },
    { t: 'Tx and Rx', d: 'Transmit and receive electrodes. The controller drives Tx and measures Rx.' },
    { t: 'Baseline', d: 'The stored reading for each crossing with nothing touching. The controller reports the difference from it.' },
    { t: 'Scan', d: 'Driving each row in turn and reading every column, to build one frame of the heat map.' },
  ],
  defaults: { wander: true, fx: 0.3, fz: 0.8, h: 0, rate: 8, heat: true },
  onChange(s, key) { if (key === 'fx' || key === 'fz') s.wander = false; },
  controls: [
    { key: 'wander', type: 'toggle', label: 'Wander (finger moves by itself)' },
    { key: 'fx', type: 'range', label: 'Finger across', min: -1.3, max: 1.3, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'fz', type: 'range', label: 'Finger up and down', min: -2.4, max: 2.4, step: 0.01, fmt: (v) => v.toFixed(2) },
    { key: 'h', type: 'range', label: 'Height above glass', min: 0, max: 1.2, step: 0.01, fmt: (v) => (v < 0.03 ? 'Touching' : v < 0.4 ? 'Hovering' : 'Lifted') },
    { key: 'rate', type: 'log', label: 'Scan speed (slow motion)', min: 1, max: 80, step: 1, fmt: (v) => v.toFixed(0) + ' rows/s' },
    { key: 'heat', type: 'toggle', label: 'Show the heat map' },
  ],
  quiz: [
    { q: 'What happens to the reading at a crossing when a finger comes near?', options: ['It rises a lot', 'It drops a little', 'Nothing', 'It turns into a voltage spike'], answer: 1, why: 'The finger takes some of the field between the row and column, so less signal reaches the column.' },
    { q: 'How does the controller get a picture of the whole screen?', options: ['One camera under the glass', 'It drives each row in turn and reads every column', 'It reads one big electrode', 'It listens for sound'], answer: 1, why: 'Row after row it sends a signal and measures all the columns. The readings make a heat map.' },
    { q: 'You lift your finger a little off the glass. The signal gets…', options: ['Stronger and narrower', 'Weaker and wider', 'The same', 'Reversed'], answer: 1, why: 'A distant finger takes less field and takes it from a wider area, so the glow is dimmer and blurrier.' },
  ],
  reel: [
    { ms: 5600, caption: 'Your fingertip steals a little of it, so that crossing reads lower.', set: { wander: false, fx: 0.4, fz: 0.5, h: 1.0, rate: 14, heat: true }, anim: { h: [1.0, 0] }, spin: 0 },
    { ms: 5200, caption: 'Row by row, the chip builds a heat map of your touch, many times a second.', set: { wander: true, h: 0, rate: 30, heat: true }, anim: { rate: [14, 60, true] }, view: { pos: [0.2, 8.2, 3.6], target: [0, 0, 0.1] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const W = SCR.w + 0.5, D = SCR.d + 0.6;
    root.add(roundedSlab(W, D, 0.16, 0.35, M.plastic(0x181c27)));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SCR.w, SCR.d), new THREE.MeshBasicMaterial({ color: 0x0a0e1a })); face.rotation.x = -Math.PI / 2; face.position.y = 0.17; root.add(face);
    const grid = electrodeGrid(root, { y: 0.19, opacity: 0.55 });
    const heat = heatPlane(root, { y: 0.25, opacity: 0.88 });
    const fing = finger(1.1); root.add(fing);
    const vals = zeros();
    const bars = []; // the readings of the row being driven
    const barMat = M.glow(COL.amber);
    for (let c = 0; c < SCR.cols; c++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), barMat); b.visible = false; root.add(b); bars.push(b); }
    const lbl = stage.label('Row being driven', [-SCR.w / 2 - 0.2, 0.25, 0], root, 'hot');
    let pos = { x: 0, z: 0 }, row = 0, acc = 0, frame = 0, lastRow = 0;
    const base = 100;
    const reading = (r, c) => base * (1 - 0.3 * touchSignal(nodeX(c), nodeZ(r), { x: pos.x, z: pos.z, h: s.h }));
    return {
      update(dt, st, time) {
        if (st.wander) { const [x, z] = wanderPath(time); pos.x = x; pos.z = z; } else { pos.x = st.fx; pos.z = st.fz; }
        const topY = 0.24;
        fing.position.set(pos.x, topY + st.h * 1.2, pos.z);
        // scan: advance rows, reading every column of each row with the finger where it is now
        acc += dt * st.rate;
        while (acc >= 1) {
          acc -= 1; row = (row + 1) % SCR.rows; lastRow = row;
          for (let c = 0; c < SCR.cols; c++) vals[row][c] = clamp((base - reading(row, c)) / 30 * 1.15, 0, 1);
          if (row === 0) frame++;
        }
        grid.tx.forEach((m, r) => { const on = r === row; m.material.color.setHex(on ? COL.amber : 0x6a5a3a); m.material.opacity = on ? 1 : 0.4; m.scale.z = on ? 2.2 : 1; });
        grid.rx.forEach((m) => { m.material.opacity = 0.7; });
        heat.mesh.visible = st.heat;
        heat.draw(vals, null);
        // bars on the active row show how far each reading fell
        for (let c = 0; c < SCR.cols; c++) {
          const v = vals[row][c], b = bars[c];
          b.visible = true; const hgt = 0.05 + v * 1.4;
          b.scale.y = hgt; b.position.set(nodeX(c), 0.25 + hgt / 2, nodeZ(row));
        }
        lbl.position.z = nodeZ(row);
      },
      readout(st) {
        const r = clamp(Math.round(rowOf(pos.z)), 0, SCR.rows - 1), c = clamp(Math.round(colOf(pos.x)), 0, SCR.cols - 1);
        const rd = reading(r, c), drop = base - rd;
        return `<div class="big">Driving row ${row + 1} of ${SCR.rows}</div>
          <p class="r-say">Frame ${frame}. A real controller finishes a whole frame in a few milliseconds, typically 60 to 240 times a second. This is slowed right down.</p>
          <div class="row"><span>Crossing nearest the finger</span><b>col ${c + 1}, row ${r + 1}</b></div>
          <div class="row"><span>No-touch baseline</span><b>${base} counts</b></div>
          <div class="row"><span>Reading with the finger</span><b>${rd.toFixed(0)} counts (${drop.toFixed(0)} lower)</b></div>`;
      },
    };
  },
};

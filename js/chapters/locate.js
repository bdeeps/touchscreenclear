// Chapter 3: from a heat map to a point. A finger covers several crossings, and the controller finds the
// centre of the glowing blob by weighting each crossing by its signal (a centroid). That gives a position
// much finer than the spacing of the electrodes. Each separate blob is a separate touch, which is multitouch.
// A blob that is too big is a palm or a cheek, and is rejected. The thresholds and the size cut-off below are
// teaching values: real phones tune them (and use more clever shape tests) for each design.
import { THREE, M, COL, SCR, roundedSlab, touchSignal, nodeX, nodeZ, colOf, rowOf, hash, clamp, wanderPath } from '../screen.js';

const R = SCR.rows, C = SCR.cols, PALM = 13;       // blobs bigger than this many nodes count as a palm
const SCENES = {
  one: { n: 'One finger', make: (t, sp) => { const [x, z] = wanderPath(t, 0.9); return [{ x: x * 0.8, z: z * 0.8, size: 1 }]; } },
  two: { n: 'Two fingers', make: (t, sp) => { const cx = Math.sin(t * 0.4) * 0.3, cz = Math.cos(t * 0.3) * 0.9, a = t * 0.25; return [{ x: cx - Math.cos(a) * sp / 2, z: cz - Math.sin(a) * sp / 2, size: 1 }, { x: cx + Math.cos(a) * sp / 2, z: cz + Math.sin(a) * sp / 2, size: 1 }]; } },
  palm: { n: 'Thumb and palm', make: (t, sp) => [{ x: Math.sin(t * 0.7) * 0.5, z: 1.1 + Math.cos(t * 0.5) * 0.3, size: 1 }, { x: 0.3, z: -2.1, size: 3.2, amp: 1.2 }] },
};

export default {
  id: 'locate',
  short: 'Finding the point',
  title: 'Where exactly? And how many?',
  subtitle: 'A blob of glow becomes a point, two blobs become two touches, and a palm is ignored.',
  view: { pos: [3.8, 7.2, 5.4], target: [0, 0.2, 0.2] },
  learn: `<p>A fingertip is much wider than the gap between electrodes, so it makes a <b>blob</b> of changed readings across several crossings. To report one point, the controller finds the blob's <b>centre of mass</b>: it averages the position of each crossing, weighted by how strongly it changed. Because the weights vary smoothly, the answer falls <b>between</b> crossings. A grid of a few millimetres can place a finger to a fraction of a millimetre.</p>
    <p>Every separate blob is its own touch, so <b>multitouch</b> comes free. Put two fingers on the glass and the picture has two blobs, each with its own centre. Pinch them together until the blobs merge and the screen can no longer tell them apart.</p>
    <p>Last, the controller looks at the <b>size and shape</b> of each blob. A palm, a cheek or a sleeve makes a big blob, which phones ignore. This is <b>palm rejection</b>. Press <b>Thumb and palm</b> to see it.</p>
    <p class="tip"><b>Try it:</b> choose <b>Two fingers</b> and shrink <b>Finger gap</b> until they merge. Raise the <b>noise</b> and watch the reported point jitter.</p>`,
  terms: [
    { t: 'Centroid', d: 'The weighted average position of a blob. It lets a coarse grid report a precise point.' },
    { t: 'Multitouch', d: 'Reporting several touches at once, each with its own position.' },
    { t: 'Threshold', d: 'The signal level a crossing must pass to count as touched. It keeps noise from being reported.' },
    { t: 'Palm rejection', d: 'Ignoring blobs that are too large or the wrong shape to be a fingertip.' },
  ],
  defaults: { scene: 'one', gap: 1.4, noise: 0.05, thr: 0.25 },
  controls: [
    { key: 'scene', type: 'seg', label: 'What is on the glass', options: Object.entries(SCENES).map(([v, o]) => ({ v, label: o.n })) },
    { key: 'gap', type: 'range', label: 'Finger gap (two fingers)', min: 0.3, max: 2.6, step: 0.01, fmt: (v) => v.toFixed(1) },
    { key: 'noise', type: 'range', label: 'Electrical noise', min: 0, max: 0.3, step: 0.005, fmt: (v) => (v < 0.01 ? 'None' : v < 0.12 ? 'Some' : 'Lots') },
    { key: 'thr', type: 'range', label: 'Touch threshold', min: 0.08, max: 0.6, step: 0.01, fmt: (v) => v.toFixed(2) },
  ],
  quiz: [
    { q: 'How can a grid of a few millimetres find a finger to a fraction of a millimetre?', options: ['It cannot', 'It takes a weighted average of the readings across the blob', 'It uses a camera', 'It makes the grid finer'], answer: 1, why: 'The centroid of the blob falls between crossings because each neighbour contributes in proportion to its signal.' },
    { q: 'Two fingers are pinched very close together. What does the screen see?', options: ['Always two touches', 'One merged blob, so one touch', 'Nothing', 'A palm'], answer: 1, why: 'When the two glows overlap into one blob, the controller has only one centre to report.' },
    { q: 'What is palm rejection?', options: ['A fingerprint lock', 'Ignoring blobs too big to be a fingertip', 'Switching the screen off', 'A way to enlarge text'], answer: 1, why: 'A resting palm makes a large blob. The controller recognises its size and shape and does not report it as a touch.' },
  ],
  reel: [
    { ms: 5400, caption: 'Two blobs are two touches. That is multitouch, and pinch to zoom.', set: { scene: 'two', gap: 2.4 }, anim: { gap: [2.4, 0.5] }, spin: 0 },
    { ms: 4800, caption: 'A big blob is a palm. The phone ignores it.', set: { scene: 'palm', gap: 1.4 }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const W = SCR.w + 0.5, D = SCR.d + 0.6;
    root.add(roundedSlab(W, D, 0.12, 0.35, M.plastic(0x181c27)));
    const bars = [];
    const geo = new THREE.BoxGeometry(SCR.w / C * 0.82, 1, SCR.d / R * 0.82);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1a2236, toneMapped: false }));
      m.position.set(nodeX(c), 0.12, nodeZ(r)); root.add(m); bars.push(m);
    }
    const rings = [];  // reported touches
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 36), M.glow(COL.lime, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), M.glow(0xffffff, { side: THREE.DoubleSide })); dot.rotation.x = -Math.PI / 2;
      g.add(ring, dot); g.visible = false; g.ring = ring; root.add(g); rings.push(g);
    }
    const truth = [];  // where the fingers really are
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.115, 20), M.glow(0xffffff, { side: THREE.DoubleSide, transparent: true, opacity: 0.8 })); t.rotation.x = -Math.PI / 2; t.visible = false; root.add(t); truth.push(t); }
    const grid = Array.from({ length: R }, () => new Array(C).fill(0));
    let out = [];
    const find = (st) => {
      const seen = Array.from({ length: R }, () => new Array(C).fill(false)), res = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        if (seen[r][c] || grid[r][c] < st.thr) continue;
        const stack = [[r, c]]; seen[r][c] = true; let sw = 0, sx = 0, sz = 0, n = 0;
        while (stack.length) {
          const [a, b] = stack.pop(); const w = grid[a][b];
          sw += w; sx += w * nodeX(b); sz += w * nodeZ(a); n++;
          for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const na = a + da, nb = b + db;
            if (na < 0 || nb < 0 || na >= R || nb >= C || seen[na][nb] || grid[na][nb] < st.thr) continue;
            seen[na][nb] = true; stack.push([na, nb]);
          }
        }
        res.push({ x: sx / sw, z: sz / sw, n, palm: n > PALM });
      }
      return res;
    };
    return {
      update(dt, st, time) {
        const ts = SCENES[st.scene].make(time, st.gap);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          let v = 0; for (const t of ts) v += touchSignal(nodeX(c), nodeZ(r), t);
          v += (hash(r, c, Math.floor(time * 12)) - 0.5) * 2 * st.noise;
          grid[r][c] = clamp(v, 0, 1.2);
        }
        out = find(st);
        bars.forEach((b, i) => {
          const r = Math.floor(i / C), c = i % C, v = grid[r][c], h = 0.02 + v * 1.5;
          b.scale.y = h; b.position.y = 0.12 + h / 2;
          const on = v >= st.thr;
          b.material.color.setRGB(on ? 0.55 + 0.45 * v : 0.1 + 0.25 * v, on ? 0.9 : 0.15 + 0.4 * v, on ? 1 : 0.3 + 0.55 * v);
        });
        rings.forEach((g, i) => {
          const o = out[i]; g.visible = !!o; if (!o) return;
          g.position.set(o.x, 1.75, o.z); g.ring.material.color.setHex(o.palm ? COL.coral : COL.lime); g.scale.setScalar(o.palm ? 3 : 1);
        });
        truth.forEach((m, i) => { const t = ts[i]; m.visible = !!t; if (t) m.position.set(t.x, 1.76, t.z); });
      },
      readout(st) {
        const lines = out.map((o, i) => `<div class="row"><span>${o.palm ? '<b class="no">Palm, ignored</b>' : 'Touch ' + (out.filter((p, j) => j <= i && !p.palm).length)}</span><b>${o.palm ? o.n + ' nodes' : `col ${(colOf(o.x) + 1).toFixed(2)}, row ${(rowOf(o.z) + 1).toFixed(2)}`}</b></div>`).join('');
        const good = out.filter((o) => !o.palm).length;
        const expect = SCENES[st.scene].make(0, st.gap).filter((t) => t.size < 2).length;
        return `<div class="big">${good} touch${good === 1 ? '' : 'es'} reported</div>
          <p class="r-say">${good < expect && st.scene === 'two' ? 'The two blobs have merged, so the screen sees one touch.' : 'Positions fall between whole crossings.'} The green ring is the reported point and the small white ring is where the finger really is.</p>${lines}`;
      },
    };
  },
};

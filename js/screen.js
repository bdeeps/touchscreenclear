// Shared parts for TouchscreenClear: a flat phone screen with a grid of touch electrodes, a finger,
// a heat-map plane that shows what the sensor reads, and the maths of how a finger changes each node.
// Units: the screen is 3 wide (x) and 5.2 long (z), roughly 65 mm wide, so 1 unit is about 22 mm.
// The numbers are a teaching model, not a real controller's firmware.
import { THREE, M, box, sphere, clamp, lerp, smooth, canvasTexture } from './kit.js';

export { THREE, M, box, sphere, clamp, lerp, smooth, canvasTexture };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const COL = { cyan: 0x8ef0ff, amber: 0xffb547, coral: 0xff7a59, lime: 0xa3e635, violet: 0xc49bff, skin: 0xd9a07f, glass: 0xcfe8ff, dark: 0x10131c };
export const SCR = { w: 3, d: 5.2, cols: 9, rows: 16 };
export const nodeX = (c) => ((c + 0.5) / SCR.cols - 0.5) * SCR.w;
export const nodeZ = (r) => ((r + 0.5) / SCR.rows - 0.5) * SCR.d;
export const colOf = (x) => (x / SCR.w + 0.5) * SCR.cols - 0.5;   // fractional node coordinates
export const rowOf = (z) => (z / SCR.d + 0.5) * SCR.rows - 0.5;

// Cheap repeatable noise, 0..1, from three numbers.
export const hash = (a, b, c = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };

// How strongly a touch changes the reading at (x, z), 0..1. A finger hovering higher is weaker and wider.
// t = { x, z, h (height above glass, units), size (1 = finger), amp }
export function touchSignal(x, z, t) {
  const h = t.h || 0, size = t.size ?? 1;
  const sig = size * (0.3 + h * 0.45), amp = (t.amp ?? 1) / (1 + (h / 0.35) ** 2);
  return amp * Math.exp(-((x - t.x) ** 2 + (z - t.z) ** 2) / (2 * sig * sig));
}

// Colour ramp for heat maps: 0 dark blue, then cyan, then amber, then white-hot.
const RAMP = [[0, [13, 21, 48]], [0.35, [34, 120, 170]], [0.6, [142, 240, 255]], [0.85, [255, 181, 71]], [1, [255, 245, 220]]];
export function heatRGB(v) {
  v = clamp(v, 0, 1);
  for (let i = 1; i < RAMP.length; i++) {
    if (v <= RAMP[i][0]) { const [a, ca] = RAMP[i - 1], [b, cb] = RAMP[i], k = (v - a) / (b - a); return ca.map((x, j) => Math.round(x + (cb[j] - x) * k)); }
  }
  return RAMP[RAMP.length - 1][1];
}
export const heatCss = (v) => `rgb(${heatRGB(v).join(',')})`;

// A rounded rectangle slab lying flat: spans y 0..t, width w (x), depth d (z).
export function roundedSlab(w, d, t, r, mat) {
  const sh = new THREE.Shape(), x = -w / 2, y = -d / 2;
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + d - r);
  sh.quadraticCurveTo(x + w, y + d, x + w - r, y + d); sh.lineTo(x + r, y + d); sh.quadraticCurveTo(x, y + d, x, y + d - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true;
  return m;
}

// A fingertip. The tip of the pad is at the group's origin; the finger leans back toward +z.
export function finger(scale = 1, { color = COL.skin, tilt = 0.55 } = {}) {
  const pivot = new THREE.Group(), body = new THREE.Group();
  const r = 0.2 * scale, len = 1.6 * scale;
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), M.plastic(color, { roughness: 0.55 }));
  mesh.castShadow = true;
  const nail = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, 0.02 * scale, r * 1.3), M.plastic(0xf2d6c4, { roughness: 0.3 }));
  nail.position.set(0, r * 0.55, -r * 0.92); nail.rotation.x = 0.55; nail.visible = false;
  body.add(mesh);
  body.position.y = len / 2 + r;
  pivot.add(body); pivot.rotation.x = tilt;
  pivot.body = mesh;
  return pivot;
}

// The grid of transparent electrodes: Tx rows run along x on top, Rx columns run along z just below.
export function electrodeGrid(parent, { y = 0, sep = 0.05, thick = 0.07, txColor = COL.amber, rxColor = COL.cyan, opacity = 0.7 } = {}) {
  const g = new THREE.Group(); g.position.y = y; parent.add(g);
  const tx = [], rx = [];
  for (let r = 0; r < SCR.rows; r++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(SCR.w, 0.02, thick), M.ghost(txColor, opacity));
    m.position.set(0, sep, nodeZ(r)); g.add(m); tx.push(m);
  }
  for (let c = 0; c < SCR.cols; c++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.02, SCR.d), M.ghost(rxColor, opacity));
    m.position.set(nodeX(c), 0, 0); g.add(m); rx.push(m);
  }
  return { group: g, tx, rx };
}

// A plane that paints a rows × cols array of 0..1 values as a heat map. Draw with hp.draw(values).
export function heatPlane(parent, { y = 0.12, opacity = 1, smoothIt = false } = {}) {
  const px = 8;
  const ct = canvasTexture(SCR.cols * px, SCR.rows * px, () => {});
  const g = ct.canvas.getContext('2d');
  ct.tex.magFilter = smoothIt ? THREE.LinearFilter : THREE.NearestFilter;
  const mat = new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SCR.w, SCR.d), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; parent.add(mesh);
  return {
    mesh,
    // vals[r][c] in 0..1. mark: optional [r,c] outlined, e.g. the node being read.
    draw(vals, mark) {
      for (let r = 0; r < SCR.rows; r++) for (let c = 0; c < SCR.cols; c++) {
        g.fillStyle = heatCss(vals[r][c]); g.fillRect(c * px, r * px, px, px);
      }
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
      for (let r = 0; r <= SCR.rows; r++) { g.beginPath(); g.moveTo(0, r * px + 0.5); g.lineTo(SCR.cols * px, r * px + 0.5); g.stroke(); }
      for (let c = 0; c <= SCR.cols; c++) { g.beginPath(); g.moveTo(c * px + 0.5, 0); g.lineTo(c * px + 0.5, SCR.rows * px); g.stroke(); }
      if (mark) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(mark[1] * px + 1, mark[0] * px + 1, px - 2, px - 2); }
      ct.tex.needsUpdate = true;
    },
  };
}

export const zeros = () => Array.from({ length: SCR.rows }, () => new Array(SCR.cols).fill(0));
// Lissajous wander over the screen, used to move a finger around without input. Returns [x, z].
export const wanderPath = (t, k = 1) => [Math.sin(t * 0.55 * k) * 1.05, Math.sin(t * 0.37 * k + 1.2) * 1.9];

// Geodesic hexagon grid, shared by the 3D world (world3d/index.html) and scripts/build_world.mjs so both
// name the same cells. It is a Goldberg polyhedron: each icosahedron face is split into f×f triangles, every
// lattice point is a cell (a hexagon, or one of the 12 pentagons at the icosahedron's corners), and a cell's
// corners are the centres of the triangles around it. The grid is uniform: cells keep their shape at the poles.
// A cell is named by a code: its face (0–19) and its place (i, j) on that face's lattice.
const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
export const ICO_V = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]].map(v => norm(...v));
export const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
// Land-cover groups and water zones, in the order the data files store them.
export const BIOMES = ['deep', 'sea', 'shelf', 'lake', 'desert', 'shrub', 'grass', 'crop', 'savanna', 'rainforest', 'forest', 'conifer', 'wetland', 'tundra', 'ice', 'mountain', 'urban'];
// The board is drawn at two levels: a base for the whole planet and a fine level near the camera, both cut
// into the same 162 regions (the cells of a frequency-4 grid) so a region can switch level on its own.
export const REGION_F = 4;

export const code = (face, i, j) => face * 262144 + i * 512 + j;
export const decode = (k) => [Math.floor(k / 262144), Math.floor(k / 512) % 512, k % 512];

// A point of a face's lattice.
export function point(face, i, j, f) {
  const [a, b, c] = ICO_F[face], A = ICO_V[a], B = ICO_V[b], C = ICO_V[c], u = i / f, v = j / f, w = 1 - u - v;
  return norm(A[0] * w + B[0] * u + C[0] * v, A[1] * w + B[1] * u + C[1] * v, A[2] * w + B[2] * u + C[2] * v);
}
// The vertex across each face's edge: ACROSS[face][k] is the far corner of the face that shares the edge
// opposite corner k.
const ACROSS = ICO_F.map((fc) => fc.map((x, k) => {
  const y = fc[(k + 1) % 3], z = fc[(k + 2) % 3];
  const g = ICO_F.find(o => o !== fc && o.includes(y) && o.includes(z));
  return g.find(v => v !== y && v !== z);
}));
// A lattice point one step past a face's edge lies on the neighbouring face: reflected across the edge, the
// weight of the far corner moves to the other face's far corner, so the point is that face's own lattice point.
function pointNear(face, i, j, f) {
  const fc = ICO_F[face], wts = [f - i - j, i, j], k = wts.findIndex(x => x < 0);
  if (k < 0) return point(face, i, j, f);
  const y = (k + 1) % 3, z = (k + 2) % 3, P = [[fc[y], wts[y] + wts[k]], [fc[z], wts[z] + wts[k]], [ACROSS[face][k], -wts[k]]];
  let x = 0, yy = 0, zz = 0;
  for (const [v, wt] of P) { const V = ICO_V[v]; x += V[0] * wt; yy += V[1] * wt; zz += V[2] * wt; }
  return norm(x, yy, zz);
}
// Tangent axes at a point, the same on both sides (the world draws tile patterns and props in this frame).
export function basis(p) {
  const up = Math.abs(p[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm(p[1] * up[2] - p[2] * up[1], p[2] * up[0] - p[0] * up[2], p[0] * up[1] - p[1] * up[0]);
  const e2 = [p[1] * e1[2] - p[2] * e1[1], p[2] * e1[0] - p[0] * e1[2], p[0] * e1[1] - p[1] * e1[0]];
  return [e1, e2];
}
export const toLatLon = (p) => [Math.asin(Math.max(-1, Math.min(1, p[1]))) * 180 / Math.PI, Math.atan2(p[0], p[2]) * 180 / Math.PI];
export const toVec = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };

// Every cell of the grid once: points on a face's edge belong to the first face that has them.
export function cells(f) {
  const seen = new Set(), out = [];
  for (let face = 0; face < 20; face++) for (let i = 0; i <= f; i++) for (let j = 0; j <= f - i; j++) {
    const p = point(face, i, j, f), key = `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)},${Math.round(p[2] * 1e6)}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push(code(face, i, j));
  }
  return out;
}

const OFF = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];   // the six lattice neighbours, in turn
// The 12 pentagons: an icosahedron corner has five neighbours, one pair on each of its five faces.
function pentagonNeighbours(vi, f) {
  const pts = [], seen = new Set();
  ICO_F.forEach((fc, face) => {
    const at = fc.indexOf(vi); if (at < 0) return;
    const pair = at === 0 ? [[1, 0], [0, 1]] : at === 1 ? [[f - 1, 0], [f - 1, 1]] : [[0, f - 1], [1, f - 1]];
    pair.forEach(([i, j]) => { const p = point(face, i, j, f), key = p.map(x => Math.round(x * 1e6)).join(); if (!seen.has(key)) { seen.add(key); pts.push(p); } });
  });
  return pts;
}
function cornerOf(face, i, j, f) {
  if (j === 0 && i === 0) return ICO_F[face][0];
  if (j === 0 && i === f) return ICO_F[face][1];
  if (i === 0 && j === f) return ICO_F[face][2];
  return -1;
}
// A cell's centre and its corners, sorted by angle around it (5 for a pentagon, 6 otherwise).
export function cellGeometry(k, f) {
  const [face, i, j] = decode(k), p = point(face, i, j, f), vi = cornerOf(face, i, j, f);
  let nb = vi >= 0 ? pentagonNeighbours(vi, f) : OFF.map(([di, dj]) => pointNear(face, i + di, j + dj, f));
  const [e1, e2] = basis(p), ang = nb.map(q => Math.atan2(q[0] * e2[0] + q[1] * e2[1] + q[2] * e2[2], q[0] * e1[0] + q[1] * e1[1] + q[2] * e1[2]));
  const order = nb.map((_, i) => i).sort((a, b) => ang[a] - ang[b]); nb = order.map(i => nb[i]);
  const corners = nb.map((n, t) => { const m = nb[(t + 1) % nb.length]; return norm(p[0] + n[0] + m[0], p[1] + n[1] + m[1], p[2] + n[2] + m[2]); });
  return { p, corners };
}

// The 162 region centres, and which region a point falls in (the nearest centre).
let REGIONS = null;
export function regionCentres() { return REGIONS || (REGIONS = cells(REGION_F).map(k => point(...decode(k), REGION_F))); }
export function regionOf(p) {
  const rc = regionCentres(); let best = 0, bd = -2;
  for (let r = 0; r < rc.length; r++) { const d = rc[r][0] * p[0] + rc[r][1] * p[1] + rc[r][2] * p[2]; if (d > bd) { bd = d; best = r; } }
  return best;
}

// One cell's record in data/world/*.bin (13 bytes, little-endian): code (u32), biome (u8), flags (u8),
// mean elevation in metres (i16, -32768 when ASTER has none), Blue Marble colour (3 × u8), lake share (u8)
// and where the lake lies on the tile (u8: angle in 16 steps, distance in 16 steps of the tile's radius).
export const RECORD = 13;
export const FLAG = { water: 1, lakeBody: 2, coast: 4, elev: 8, ridge1: 16, ridge2: 32, lake: 64 };

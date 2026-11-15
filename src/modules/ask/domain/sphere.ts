/*
 * The Earth of the home, as numbers (POC ask.js homeSphere). A sphere is laid into part of a pixel
 * grid: every pixel inside the disc learns its latitude, longitude and light once, so turning the
 * planet only shifts longitudes. The sun sits up and to the left, a little in front: the night side
 * stays faintly lit. Drawing to a canvas happens in the UI; this file only fills pixel arrays.
 */

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/** The Americas face the reader when the welcome turn ends. */
export const EARTH_FACING = -80 * DEG;
/** The welcome turn: about 140° in 2.4 s, slowing down at the end. */
export const INTRO_TURN = 2.44;
export const INTRO_MS = 2400;

/** NASA Blue Marble from GIBS, a whole-world equirectangular image (cross-origin, CORS enabled). */
export const EARTH_TEXTURE_URL = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${new URLSearchParams(
  {
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: "BlueMarble_ShadedRelief_Bathymetry",
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: "-90,-180,90,180",
    WIDTH: "1024",
    HEIGHT: "512",
    FORMAT: "image/jpeg",
  },
)}`;

export type SphereGeometry = {
  /** Size of the pixel grid. */
  width: number;
  height: number;
  /** Device pixels per CSS pixel; the centre and radius are in CSS pixels. */
  dpr: number;
  cx: number;
  cy: number;
  r: number;
  /** Axial tilt seen by the reader, in degrees (23.5 like the logo). */
  roll?: number;
  /** How far the north pole leans towards the reader, in degrees. */
  pitch?: number;
};

export type SphereMap = {
  /** Pixels inside the disc. */
  count: number;
  lat: Float32Array;
  lon: Float32Array;
  shade: Float32Array;
  /** Byte offset of each disc pixel in an RGBA buffer of the grid. */
  at: Int32Array;
};

export type Texture = { width: number; height: number; data: Uint8ClampedArray };

const SUN = [-0.58, 0.42, 0.7] as const;
const SUN_LENGTH = Math.hypot(...SUN);

export const easeOutCubic = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

function rotation(roll: number, pitch: number) {
  const a = -roll * DEG;
  const b = -pitch * DEG;
  return { ca: Math.cos(a), sa: Math.sin(a), cb: Math.cos(b), sb: Math.sin(b) };
}

/** Latitude, longitude and light of every pixel of the disc. */
export function projectSphere(geometry: SphereGeometry): SphereMap {
  const { width, height, dpr, cx, cy, r, roll = 23.5, pitch = 12 } = geometry;
  const y0 = Math.max(0, Math.floor((cy - r) * dpr));
  const y1 = Math.min(height, Math.ceil((cy + r) * dpr));
  const x0 = Math.max(0, Math.floor((cx - r) * dpr));
  const x1 = Math.min(width, Math.ceil((cx + r) * dpr));
  // Sized to the disc's box, not the canvas: the horizon is a thin slice of a huge sphere.
  const cap = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  const map: SphereMap = {
    count: 0,
    lat: new Float32Array(cap),
    lon: new Float32Array(cap),
    shade: new Float32Array(cap),
    at: new Int32Array(cap),
  };
  const { ca, sa, cb, sb } = rotation(roll, pitch);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const nx = ((px + 0.5) / dpr - cx) / r;
      const ny = -((py + 0.5) / dpr - cy) / r;
      const d = nx * nx + ny * ny;
      if (d >= 1) continue;
      const z = Math.sqrt(1 - d);
      const xr = nx * ca - ny * sa;
      const yr = nx * sa + ny * ca;
      const m = map.count++;
      map.lat[m] = Math.asin(Math.max(-1, Math.min(1, yr * cb - z * sb)));
      map.lon[m] = Math.atan2(xr, yr * sb + z * cb);
      const light = Math.max(0, (nx * SUN[0] + ny * SUN[1] + z * SUN[2]) / SUN_LENGTH);
      map.shade[m] = 0.1 + 0.98 * Math.pow(light, 0.75) * (0.82 + 0.18 * z);
      map.at[m] = (py * width + px) * 4;
    }
  }
  return map;
}

/** Paints the textured, lit disc into an RGBA buffer of the grid, turned by `turn` radians. */
export function paintSphere(
  map: SphereMap,
  texture: Texture,
  turn: number,
  out: Uint8ClampedArray,
) {
  const { width: w, height: h, data } = texture;
  for (let i = 0; i < map.count; i++) {
    let u = (map.lon[i] + turn) / TWO_PI + 0.5;
    u -= Math.floor(u);
    const tx = Math.min(w - 1, Math.trunc(u * w));
    const ty = Math.min(h - 1, Math.trunc((0.5 - map.lat[i] / Math.PI) * h));
    const k = (ty * w + tx) * 4;
    const s = map.shade[i];
    const o = map.at[i];
    out[o] = data[k] * s;
    out[o + 1] = data[k + 1] * s;
    out[o + 2] = Math.min(255, data[k + 2] * s + (1 - s) * 18);
    out[o + 3] = 255;
  }
}

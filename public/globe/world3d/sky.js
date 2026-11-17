/* The sky around the 3D world: decoration and curiosity, never data. Nothing here is drawn from NASA figures; it
   sets the scene the Earth turns in, and a few things in it answer a tap (the satellite, the Moon, ten constellations).

   What is in it, and why each piece makes sense next to the Earth:
   - The Milky Way, faint nebulae and the unresolved glow of far stars, baked once into a sky sphere (one GPU pass at
     load, then a plain texture), so the night has depth instead of a flat black.
   - Stars with real colours (blue-white hot stars to orange cool ones), denser along the Milky Way; a few bright
     ones carry the four-point spikes a telescope draws; planets shine steady along the ecliptic (planets do not
     twinkle, stars do).
   - Shooting stars, now and then a small shower from one radiant, tinted as meteors burn (magnesium green,
     sodium orange).
   - Now and then one comet, small and quiet, with a green coma, a faint straight ion tail and a soft dust tail,
     both pointing away from the Sun that lights the Earth, as real tails do. It keeps clear of the planet and the
     controls.
   - The Moon, lit by that same Sun, so its phase agrees with the light on the planet. Its card gives today's real
     phase; three taps on it mark where Apollo 11 landed.
   - Ten constellations people know, their main stars at their real places and turned by sidereal time, so the
     Pole Star sits over the North Pole. Pointing at one draws its figure; a tap opens its card.
   - Auroras round both geomagnetic poles, where they really are.
   - NASA's Terra satellite on a near-polar orbit: the MODIS images and vegetation data in the case files come
     from it, so it is the one satellite drawn. Its orbit is out of scale, like the relief; pointing at it shows
     its orbit and the strip of ground it sweeps, and a tap opens a card that says what it does for the portal.

   The sky group follows the camera's position (not its turn), so stars stay at infinity: they never slide as the
   planet turns under the finger. Reduced motion stills everything: no twinkle, no shooting stars, the comets
   and auroras hold their place. */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(TAU * Math.random());
// A seeded generator for what must look the same on every visit (the Moon's face, the planets' places).
function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// The galactic plane and its centre, and the ecliptic: fixed directions in the world.
const G = new THREE.Vector3(0.35, 0.82, -0.45).normalize();                  // galactic north
const GC = new THREE.Vector3(-0.6, 0.0, -0.8).projectOnPlane(G).normalize();  // towards the galactic centre
const ECL = new THREE.Vector3(-0.15, 0.97, 0.2).normalize();                 // ecliptic north

// GLSL shared by the baked sky: value noise and fbm on the unit sphere (no seams, no poles).
const NOISE = `
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
`;

/* ---------- The Milky Way and the nebulae, baked once ---------- */
function bakeSky(renderer, mobile) {
  const W = mobile ? 1024 : 2048, H = W / 2;
  const rt = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    uniforms: { G: { value: G }, C: { value: GC } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    // Colours are written as on screen (sRGB) and turned linear at the end; the target stores them as sRGB.
    fragmentShader: `uniform vec3 G; uniform vec3 C; varying vec2 vUv; ${NOISE}
    void main(){
      // The same mapping as THREE.SphereGeometry's uv, so each texel is the direction its vertex points to.
      float phi = vUv.x * 6.2831853, th = (1.0 - vUv.y) * 3.14159265;
      vec3 d = vec3(-cos(phi) * sin(th), cos(th), sin(phi) * sin(th));
      float b = dot(d, G);
      float warp = fbm(d * 2.2);
      float band = exp(-pow((b + (warp - 0.5) * 0.14) / 0.17, 2.0));
      vec3 gl0 = normalize(d - G * b + 1e-5);
      float core = exp(-pow(acos(clamp(dot(gl0, C), -1.0, 1.0)), 2.0) / 0.8) * exp(-pow(b / 0.3, 2.0));
      float clouds = fbm(d * 5.5 + 3.0), fine = fbm(d * 15.0);
      float glow = band * (0.3 + 0.7 * clouds) * (0.45 + 1.1 * core);
      // Dark dust lanes along the middle of the band, thickest towards the centre.
      float lanes = smoothstep(0.47, 0.72, fbm(d * 7.0 + 11.0)) * exp(-pow((b + (warp - 0.5) * 0.05) / 0.07, 2.0)) * (0.5 + 0.5 * core);
      glow *= 1.0 - 0.8 * lanes;
      vec3 col = mix(vec3(0.006, 0.012, 0.035), vec3(0.014, 0.022, 0.06), band);
      col += mix(vec3(0.13, 0.15, 0.27), vec3(0.4, 0.31, 0.24), core) * glow * 0.95;
      col += vec3(0.26, 0.24, 0.34) * glow * pow(fine, 2.5) * 1.3;
      // Nebulae: violet and teal clouds over the sky, rose glow (ionised hydrogen) inside the band.
      col += vec3(0.24, 0.07, 0.34) * smoothstep(0.56, 0.86, fbm(d * 1.6 + 20.0)) * 0.32;
      col += vec3(0.03, 0.17, 0.21) * smoothstep(0.58, 0.88, fbm(d * 1.9 + 40.0)) * 0.28;
      col += vec3(0.34, 0.08, 0.14) * smoothstep(0.6, 0.86, fbm(d * 2.6 + 60.0)) * band * 0.4;
      col += (hash(vec3(gl_FragCoord.xy, 7.0)) - 0.5) / 255.0;   // dither: no banding in the dark gradient
      gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
    }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  sc.add(quad);
  const prev = renderer.getRenderTarget(), tm = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setRenderTarget(rt); renderer.render(sc, cam); renderer.setRenderTarget(prev);
  renderer.toneMapping = tm;
  quad.geometry.dispose(); mat.dispose();
  return rt;
}

/* ---------- Stars ---------- */
// Share of stars by kind, with the colour each shows (blue-white hot to orange-red cool).
const STAR_KINDS = [[0.08, '#9db4ff'], [0.2, '#c8d6ff'], [0.26, '#f4f3ff'], [0.2, '#fff2e0'], [0.17, '#ffd7a8'], [0.09, '#ffbe86']];
function starColor() { let r = Math.random(); for (const [p, c] of STAR_KINDS) { if ((r -= p) <= 0) return new THREE.Color(c); } return new THREE.Color('#ffffff'); }
function skyDir(nearBand) {
  if (!nearBand) return new THREE.Vector3().randomDirection();
  const t = new THREE.Vector3().randomDirection().projectOnPlane(G).normalize();
  return t.addScaledVector(G, THREE.MathUtils.clamp(gauss() * 0.13, -0.6, 0.6)).normalize();
}
const STAR_V = `attribute float size; attribute vec3 color; attribute float seed; attribute float tw;
  uniform float t; uniform float px; uniform float moving; varying vec3 vC; varying float vA;
  void main(){ vC = color; float k = tw * (0.5 + 0.5 * sin(t * (1.1 + fract(seed) * 2.2) + seed * 7.0));
    vA = 1.0 - 0.6 * k * moving; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * px; gl_Position = projectionMatrix * p; }`;
const STAR_F = `varying vec3 vC; varying float vA;
  void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = (smoothstep(0.55, 0.0, d) + exp(-d * d * 5.0) * 0.55) * vA;
    if (a < 0.01) discard; gl_FragColor = vec4(vC, a); }`;
// Bright stars: a core, a soft halo and the four spikes of a telescope's struts. Planets: a steady round disc.
const BRIGHT_F = `varying vec3 vC; varying float vA; uniform float spikes;
  void main(){ vec2 q = (gl_PointCoord - 0.5) * 2.0; float r = length(q);
    float core = exp(-r * r * 60.0) + exp(-r * r * 9.0) * 0.32;
    float spk = (exp(-abs(q.x) * 55.0) * exp(-abs(q.y) * 3.2) + exp(-abs(q.y) * 55.0) * exp(-abs(q.x) * 3.2)) * 0.6 * spikes;
    float a = (core + spk) * vA * smoothstep(1.0, 0.7, r); if (a < 0.01) discard; gl_FragColor = vec4(mix(vC, vec3(1.0), core * 0.5), a); }`;
function points(list, frag, px, extra = {}) {
  const n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), seed = new Float32Array(n), tw = new Float32Array(n);
  list.forEach((s, i) => { pos.set([s.p.x, s.p.y, s.p.z], i * 3); col.set([s.c.r, s.c.g, s.c.b], i * 3); size[i] = s.size; seed[i] = Math.random() * 100; tw[i] = s.tw; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('tw', new THREE.BufferAttribute(tw, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: 0 }, px: { value: px }, moving: { value: 1 }, ...extra }, vertexShader: STAR_V, fragmentShader: frag });
  const o = new THREE.Points(g, m); o.frustumCulled = false; return o;
}

/* ---------- The Moon ---------- */
function moonTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = seeded(1969);
  g.fillStyle = '#a7a59f'; g.fillRect(0, 0, 512, 256);
  // Maria: wide dark seas, mostly on the face we look at (the middle of the map).
  for (let i = 0; i < 14; i++) {
    const x = 150 + r() * 220, y = 50 + r() * 150, rad = 18 + r() * 46, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(58,60,66,0.7)'); gr.addColorStop(0.7, 'rgba(70,72,78,0.45)'); gr.addColorStop(1, 'rgba(80,80,84,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  }
  // Craters: a dark floor and a lit rim, many small ones and a few large.
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = 14 + r() * 228, rad = Math.pow(r(), 3) * 14 + 1.2;
    g.fillStyle = 'rgba(70,70,74,0.5)'; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(225,223,215,0.55)'; g.lineWidth = Math.max(0.6, rad * 0.22); g.beginPath(); g.arc(x - rad * 0.15, y - rad * 0.15, rad, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
  }
  // A young bright crater with rays (Tycho), so the face reads as the Moon at a glance.
  const tx = 262, ty = 178; g.strokeStyle = 'rgba(240,238,230,0.22)'; g.lineWidth = 1.4;
  for (let i = 0; i < 18; i++) { const a = r() * TAU, l = 30 + r() * 70; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.6); g.stroke(); }
  g.fillStyle = '#ecebe4'; g.beginPath(); g.arc(tx, ty, 4, 0, TAU); g.fill();
  const img = g.getImageData(0, 0, 512, 256), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function glowTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- Curiosities: the Moon's card, Apollo 11, and a few real constellations ---------- */
// Today's real phase of the Moon, from the mean synodic month counted from a known new Moon (good to about a day).
const SYNODIC = 29.530588853, NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14);
const PHASES = [[1, 'Luna nueva', 'New Moon'], [6.4, 'Luna creciente', 'Waxing crescent'], [8.4, 'Cuarto creciente', 'First quarter'], [13.8, 'Gibosa creciente', 'Waxing gibbous'], [15.8, 'Luna llena', 'Full Moon'], [21.1, 'Gibosa menguante', 'Waning gibbous'], [23.1, 'Cuarto menguante', 'Last quarter'], [28.5, 'Luna menguante', 'Waning crescent'], [Infinity, 'Luna nueva', 'New Moon']];
function moonPhase(ms) {
  const age = ((((ms - NEW_MOON_2000) / 864e5) % SYNODIC) + SYNODIC) % SYNODIC;
  return { lit: (1 - Math.cos((TAU * age) / SYNODIC)) / 2, name: PHASES.find((p) => age < p[0]) };
}
// Greenwich sidereal angle: turned by it, each catalogue star stands over the place it is over right now.
const gmst = (ms) => THREE.MathUtils.degToRad((280.46061837 + 360.98564736629 * (ms / 864e5 + 2440587.5 - 2451545)) % 360);
// A star's direction from its right ascension (hours) and declination, in the planet's own frame (as toVec does).
function starDir(raH, dec) {
  const p = THREE.MathUtils.degToRad(dec), l = THREE.MathUtils.degToRad(raH * 15);
  return new THREE.Vector3(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l));
}
// Ten constellations people know, with their main stars at their J2000 places: [RA h, Dec °, magnitude, colour].
// The lines join them as the usual figures do. Generated with the portal's copy (exp.sky.c.*); keep both in step.
const CONSTELLATIONS = [
  {"id": "orion", "name": ["Orión", "Orion"], "lead": ["El cazador: dos hombros, dos pies y un cinturón de tres estrellas en fila.", "The hunter: two shoulders, two feet and a belt of three stars in a row."], "facts": [["Las tres del cinturón son las que en Chile se llaman las Tres Marías.", "The three in the belt are the ones called the Three Marys in Chile."], ["Betelgeuse, su hombro rojizo, es una supergigante al final de su vida.", "Betelgeuse, its reddish shoulder, is a supergiant near the end of its life."], ["Está sobre el ecuador celeste, así que se ve desde todo el planeta.", "It sits on the celestial equator, so it can be seen from the whole planet."]], "star": ["Rigel", "Rigel"], "seen": ["Todo el planeta", "The whole planet"], "stars": [[5.919, 7.407, 0.5, "#ffbe86"], [5.242, -8.202, 0.13, "#c8d6ff"], [5.419, 6.35, 1.64, "#c8d6ff"], [5.533, -0.299, 2.23, null], [5.604, -1.202, 1.69, "#c8d6ff"], [5.679, -1.943, 1.77, "#c8d6ff"], [5.796, -9.67, 2.06, "#c8d6ff"], [5.586, 9.934, 3.39, null]], "lines": [[7, 0], [7, 2], [0, 2], [0, 5], [2, 3], [3, 4], [4, 5], [5, 6], [3, 1]]},
  {"id": "ursa-major", "name": ["Osa Mayor", "Ursa Major"], "lead": ["Sus siete estrellas más brillantes forman el Carro, una de las figuras más fáciles de reconocer.", "Its seven brightest stars make the Big Dipper, one of the easiest shapes to find."], "facts": [["Merak y Dubhe, el borde del Carro, apuntan hacia la Estrella Polar.", "Merak and Dubhe, the edge of the Dipper, point to the Pole Star."], ["Mizar, en el mango, tiene al lado a Alcor: verlas separadas era una prueba de buena vista.", "Mizar, in the handle, has Alcor beside it: seeing the two apart was a test of good eyesight."], ["Desde buena parte del hemisferio norte nunca se pone: da vueltas alrededor del polo.", "From much of the northern hemisphere it never sets: it circles the pole."]], "star": ["Alioth", "Alioth"], "seen": ["Hemisferio norte", "Northern hemisphere"], "stars": [[11.062, 61.751, 1.79, "#ffd7a8"], [11.031, 56.382, 2.37, null], [11.897, 53.695, 2.44, null], [12.257, 57.033, 3.31, null], [12.9, 55.96, 1.77, null], [13.399, 54.925, 2.27, null], [13.792, 49.313, 1.86, "#c8d6ff"]], "lines": [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]},
  {"id": "ursa-minor", "name": ["Osa Menor", "Ursa Minor"], "lead": ["Un carro pequeño con la Estrella Polar en la punta de su mango.", "A small dipper with the Pole Star at the tip of its handle."], "facts": [["Polaris está casi justo sobre el polo norte de la Tierra.", "Polaris sits almost exactly above the Earth's North Pole."], ["Por eso parece quieta mientras el resto del cielo gira a su alrededor.", "That is why it seems to stand still while the rest of the sky turns around it."], ["Durante siglos sirvió para encontrar el norte en el mar.", "For centuries it was used to find north at sea."]], "star": ["Polaris", "Polaris"], "seen": ["Hemisferio norte", "Northern hemisphere"], "stars": [[2.53, 89.264, 1.98, "#fff2e0"], [17.537, 86.586, 4.35, null], [16.766, 82.037, 4.2, null], [15.734, 77.795, 4.3, null], [14.845, 74.156, 2.08, "#ffbe86"], [15.346, 71.834, 3.0, null], [16.292, 75.755, 4.95, null]], "lines": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]},
  {"id": "cassiopeia", "name": ["Casiopea", "Cassiopeia"], "lead": ["Cinco estrellas que dibujan una W, o una M, según la hora de la noche.", "Five stars that draw a W, or an M, depending on the time of night."], "facts": [["Está al otro lado de la Polar respecto de la Osa Mayor: cuando una sube, la otra baja.", "It sits across the Pole Star from Ursa Major: when one rises, the other sinks."], ["Lleva el nombre de una reina de la mitología griega.", "It is named after a queen in Greek mythology."], ["Cruza la Vía Láctea, así que a su alrededor el cielo se ve lleno de estrellas.", "It lies across the Milky Way, so the sky around it looks full of stars."]], "star": ["Schedar", "Schedar"], "seen": ["Hemisferio norte", "Northern hemisphere"], "stars": [[0.153, 59.15, 2.27, null], [0.675, 56.537, 2.24, "#ffd7a8"], [0.945, 60.717, 2.47, "#c8d6ff"], [1.43, 60.235, 2.68, null], [1.907, 63.67, 3.37, "#c8d6ff"]], "lines": [[0, 1], [1, 2], [2, 3], [3, 4]]},
  {"id": "crux", "name": ["Cruz del Sur", "Southern Cross"], "lead": ["Cuatro estrellas en cruz, la guía del cielo austral.", "Four stars in a cross, the guide of the southern sky."], "facts": [["Es la más pequeña de las 88 constelaciones.", "It is the smallest of the 88 constellations."], ["Su brazo largo, de Gacrux a Acrux, alargado unas cuatro veces y media, llega cerca del polo sur celeste.", "Its long arm, from Gacrux to Acrux, stretched about four and a half times, reaches close to the south celestial pole."], ["Aparece en las banderas de Australia, Brasil, Nueva Zelanda, Papúa Nueva Guinea y Samoa.", "It appears on the flags of Australia, Brazil, New Zealand, Papua New Guinea and Samoa."]], "star": ["Acrux", "Acrux"], "seen": ["Hemisferio sur", "Southern hemisphere"], "stars": [[12.443, -63.099, 0.77, "#c8d6ff"], [12.795, -59.689, 1.25, "#c8d6ff"], [12.52, -57.113, 1.64, "#ffbe86"], [12.253, -58.749, 2.79, "#c8d6ff"]], "lines": [[2, 0], [1, 3]]},
  {"id": "scorpius", "name": ["Escorpio", "Scorpius"], "lead": ["Un escorpión con un corazón rojo y una cola curva que termina en el aguijón.", "A scorpion with a red heart and a curved tail that ends in its sting."], "facts": [["Antares, su corazón, es una supergigante: en el lugar del Sol llegaría más allá de la órbita de Marte.", "Antares, its heart, is a supergiant: in the Sun's place it would reach past the orbit of Mars."], ["Su nombre quiere decir «rival de Marte», por su color.", "Its name means “rival of Mars”, for its colour."], ["Se ve alta en las noches de invierno del hemisferio sur.", "It stands high on winter nights in the southern hemisphere."]], "star": ["Antares", "Antares"], "seen": ["Hemisferio sur", "Southern hemisphere"], "stars": [[16.091, -19.806, 2.62, "#c8d6ff"], [16.006, -22.622, 2.29, "#c8d6ff"], [15.981, -26.114, 2.89, "#c8d6ff"], [16.353, -25.593, 2.89, null], [16.49, -26.432, 1.06, "#ffa070"], [16.598, -28.216, 2.82, "#c8d6ff"], [16.836, -34.293, 2.29, "#ffd7a8"], [16.864, -38.047, 3.0, null], [16.91, -42.362, 3.6, null], [17.203, -43.239, 3.3, null], [17.622, -42.998, 1.86, null], [17.793, -40.127, 3.0, null], [17.708, -39.03, 2.4, "#c8d6ff"], [17.56, -37.104, 1.62, "#c8d6ff"], [17.513, -37.296, 2.7, "#c8d6ff"]], "lines": [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]]},
  {"id": "leo", "name": ["Leo", "Leo"], "lead": ["Un león echado: la cabeza es una hoz, como un signo de interrogación al revés.", "A lion lying down: its head is a sickle, like a backwards question mark."], "facts": [["La hoz termina en Regulus, el corazón del león.", "The sickle ends in Regulus, the lion's heart."], ["Regulus está casi sobre el camino del Sol, así que la Luna y los planetas pasan cerca de ella.", "Regulus lies almost on the Sun's path, so the Moon and the planets pass close to it."], ["De Leo parecen salir las Leónidas, la lluvia de estrellas de noviembre.", "The Leonids, November's meteor shower, seem to come out of Leo."]], "star": ["Regulus", "Regulus"], "seen": ["Todo el planeta", "The whole planet"], "stars": [[10.14, 11.967, 1.35, "#c8d6ff"], [10.122, 16.763, 3.5, null], [10.333, 19.842, 2.0, "#ffd7a8"], [10.278, 23.417, 3.4, null], [9.879, 26.007, 3.9, "#ffd7a8"], [9.764, 23.774, 2.98, "#fff2e0"], [11.235, 20.524, 2.56, null], [11.237, 15.43, 3.33, null], [11.818, 14.572, 2.14, null]], "lines": [[5, 4], [4, 3], [3, 2], [2, 1], [1, 0], [0, 7], [7, 8], [8, 6], [6, 2]]},
  {"id": "cygnus", "name": ["Cisne", "Cygnus"], "lead": ["Un cisne que vuela a lo largo de la Vía Láctea; también se la llama la Cruz del Norte.", "A swan flying along the Milky Way; it is also called the Northern Cross."], "facts": [["Deneb, su cola, está a más de mil años luz y aun así se ve a simple vista: es enormemente luminosa.", "Deneb, its tail, is over a thousand light-years away and still shows to the naked eye: it is hugely luminous."], ["Deneb, Vega y Altair forman el Triángulo de Verano del norte.", "Deneb, Vega and Altair make the northern Summer Triangle."], ["Albireo, su pico, son dos estrellas de colores distintos, una dorada y otra azul.", "Albireo, its beak, is two stars of different colours, one golden and one blue."]], "star": ["Deneb", "Deneb"], "seen": ["Hemisferio norte", "Northern hemisphere"], "stars": [[20.691, 45.28, 1.25, null], [20.371, 40.257, 2.23, "#fff2e0"], [19.512, 27.96, 3.1, "#ffd7a8"], [20.77, 33.97, 2.48, "#ffd7a8"], [19.75, 45.131, 2.87, "#c8d6ff"]], "lines": [[0, 1], [1, 2], [3, 1], [1, 4]]},
  {"id": "lyra", "name": ["Lira", "Lyra"], "lead": ["Una lira pequeña colgada de Vega, una de las estrellas más brillantes del cielo.", "A small lyre hanging from Vega, one of the brightest stars in the sky."], "facts": [["Vega es la quinta estrella más brillante del cielo nocturno y está a 25 años luz.", "Vega is the fifth brightest star in the night sky and lies 25 light-years away."], ["Como el eje de la Tierra se bambolea, en unos 12.000 años Vega será la estrella polar del norte.", "Because the Earth's axis wobbles, in about 12,000 years Vega will be the northern pole star."], ["De ella parecen salir las Líridas, la lluvia de estrellas de abril.", "The Lyrids, April's meteor shower, seem to come out of it."]], "star": ["Vega", "Vega"], "seen": ["Hemisferio norte", "Northern hemisphere"], "stars": [[18.616, 38.784, 0.03, "#c8d6ff"], [18.739, 39.67, 4.7, null], [18.746, 37.605, 4.4, null], [18.908, 36.899, 4.3, "#ffbe86"], [18.982, 32.69, 3.25, "#c8d6ff"], [18.835, 33.363, 3.5, "#c8d6ff"]], "lines": [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 2]]},
  {"id": "canis-major", "name": ["Can Mayor", "Canis Major"], "lead": ["El perro grande del cazador Orión, con Sirio, la estrella más brillante de la noche.", "The hunter Orion's big dog, with Sirius, the brightest star of the night."], "facts": [["Sirio está a solo 8,6 años luz: brilla tanto sobre todo por estar cerca.", "Sirius is only 8.6 light-years away: it shines so bright mostly because it is close."], ["El cinturón de Orión apunta hacia Sirio: así se la encuentra.", "Orion's belt points to Sirius: that is how to find it."], ["Sirio da unas 25 veces más luz que el Sol.", "Sirius gives off about 25 times as much light as the Sun."]], "star": ["Sirio", "Sirius"], "seen": ["Todo el planeta", "The whole planet"], "stars": [[6.753, -16.716, -1.46, "#dbe4ff"], [6.378, -17.956, 1.98, "#c8d6ff"], [7.14, -26.393, 1.83, "#fff2e0"], [6.977, -28.972, 1.5, "#c8d6ff"], [7.402, -29.303, 2.45, "#c8d6ff"], [6.339, -30.063, 3.0, "#c8d6ff"]], "lines": [[1, 0], [0, 2], [2, 3], [2, 4], [3, 5]]},
];
// Pixel distance from p to the segment ab.
function segDist(p, a, b) {
  const abx = b.x - a.x, aby = b.y - a.y, l = abx * abx + aby * aby;
  const t = l ? Math.min(1, Math.max(0, ((p.x - a.x) * abx + (p.y - a.y) * aby) / l)) : 0;
  return Math.hypot(p.x - a.x - abx * t, p.y - a.y - aby * t);
}

/* ---------- Everything together ---------- */
export function createSky({ renderer, scene, camera, sun, R = 1, mobile = false, reduced = () => false, say = (es) => es }) {
  const px = renderer.getPixelRatio();
  const group = new THREE.Group(); group.name = 'sky'; scene.add(group);
  const disposables = [];

  // Sky sphere at "infinity": it follows the camera, drawn first and behind everything.
  const rt = bakeSky(renderer, mobile);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 64, 32), new THREE.MeshBasicMaterial({ map: rt.texture, side: THREE.BackSide, depthWrite: false, toneMapped: false, fog: false }));
  dome.renderOrder = -10; group.add(dome);

  // Stars: a third gather along the Milky Way.
  // Brightness follows a steep curve, as in a real sky: thousands of faint stars, a few hundred clear ones.
  const N = mobile ? 4500 : 9000, list = [];
  for (let i = 0; i < N; i++) {
    const big = Math.pow(Math.random(), 6), glow = 0.32 + 0.68 * Math.min(1, big * 2.5 + Math.pow(Math.random(), 3) * 0.6);
    list.push({ p: skyDir(i < N * 0.45).multiplyScalar(200), c: starColor().multiplyScalar(glow), size: 1.5 + big * 3.6, tw: big > 0.04 ? 0.3 + Math.random() * 0.6 : Math.random() * 0.25 });
  }
  const stars = points(list, STAR_F, px); stars.renderOrder = -9; group.add(stars);
  const brightList = Array.from({ length: mobile ? 14 : 24 }, () => ({ p: skyDir(Math.random() < 0.4).multiplyScalar(190), c: starColor(), size: rand(16, 30), tw: rand(0.2, 0.5) }));
  const bright = points(brightList, BRIGHT_F, px, { spikes: { value: 1 } }); bright.renderOrder = -8; group.add(bright);

  // Planets along the ecliptic: steady points with their colour (Venus, Mars, Jupiter, Saturn).
  const er = seeded(42), e1 = new THREE.Vector3(1, 0, 0).projectOnPlane(ECL).normalize(), e2 = new THREE.Vector3().crossVectors(ECL, e1);
  const planetList = [['#fff6dc', 11], ['#ff9d6a', 7.5], ['#ffe9c4', 9.5], ['#f3dca4', 7]].map(([c, size]) => {
    const a = er() * TAU, lat = (er() - 0.5) * 0.06;
    return { p: e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)).addScaledVector(ECL, lat).normalize().multiplyScalar(180), c: new THREE.Color(c), size, tw: 0 };
  });
  const planets = points(planetList, BRIGHT_F, px, { spikes: { value: 0 } }); planets.renderOrder = -8; group.add(planets);
  const starMats = [stars.material, bright.material, planets.material];

  // The Moon, to the right of the planet in the first view, lit by the same Sun.
  const sunDir = new THREE.Vector3(0, 1, 0);
  const moonDir = new THREE.Vector3(0.665, -0.02, -0.744).normalize();
  const MOON_D = 90;   // its distance from the camera: always the same size on screen
  const moonMap = moonTexture();
  const moonMat = new THREE.ShaderMaterial({ uniforms: { map: { value: moonMap }, sunDir: { value: sunDir } },
    vertexShader: 'varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 sunDir; varying vec3 vN; varying vec2 vUv; void main(){ float l = dot(normalize(vN), sunDir); float lit = smoothstep(-0.04, 0.25, l) * (0.35 + 0.75 * max(l, 0.0)); vec3 tex = texture2D(map, vUv).rgb; gl_FragColor = vec4(tex * lit + vec3(0.012, 0.02, 0.035) * (1.0 - lit), 1.0); }' });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), moonMat);
  moon.position.copy(moonDir).multiplyScalar(MOON_D); moon.rotation.y = Math.PI * 0.5; moon.renderOrder = -7; group.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(220,230,255,0.28)'], [0.35, 'rgba(170,190,255,0.08)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  moonGlow.scale.setScalar(9); moonGlow.position.copy(moon.position).multiplyScalar(1.02); moonGlow.renderOrder = -7.5; group.add(moonGlow);
  disposables.push(moonMap, moonGlow.material.map);
  // Pointing at the Moon lifts its halo. Three taps mark where Apollo 11 landed: the Sea of Tranquillity, 0.67° N
  // 23.47° E, on the face it turns to the Earth (east to the right as we look at it, north up).
  const MOON_R = 1.5, moonHit = new THREE.Sphere(new THREE.Vector3(), MOON_R * 1.4);
  let moonLit = 0, apollo = false;
  const site = (() => {
    const f = moonDir, u = new THREE.Vector3(0, 1, 0).projectOnPlane(f).normalize(), r = new THREE.Vector3().crossVectors(f, u);
    const la = THREE.MathUtils.degToRad(0.674), lo = THREE.MathUtils.degToRad(23.473);
    return f.clone().multiplyScalar(-Math.cos(la) * Math.cos(lo)).addScaledVector(r, Math.cos(la) * Math.sin(lo)).addScaledVector(u, Math.sin(la));
  })();
  const apolloDot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,214,102,1)'], [0.32, 'rgba(255,190,70,1)'], [0.42, 'rgba(255,170,50,0.35)'], [1, 'rgba(255,170,50,0)']]), depthTest: false, depthWrite: false, toneMapped: false }));
  apolloDot.position.copy(moon.position).addScaledVector(site, MOON_R * 1.02); apolloDot.scale.setScalar(0.6); apolloDot.renderOrder = -6.5; apolloDot.visible = false; group.add(apolloDot);
  const apolloEl = document.createElement('div'); apolloEl.className = 'sky-lbl'; apolloEl.textContent = say('Apolo 11 · 1969', 'Apollo 11 · 1969');
  const apolloLbl = new CSS2DObject(apolloEl); apolloLbl.center.set(0, 0.5); apolloLbl.position.copy(apolloDot.position); apolloLbl.visible = false; group.add(apolloLbl);
  disposables.push(apolloDot.material.map, apolloDot.material);
  const _hidden = new THREE.Ray(), _earth = new THREE.Sphere(new THREE.Vector3(), R);

  // The constellations: their stars always shine among the others; pointing at one draws its figure and says its name.
  const cGroup = new THREE.Group(); cGroup.name = 'constellations'; group.add(cGroup);
  const C_R = 195, cDimList = [], cBrightList = [];
  const cons = CONSTELLATIONS.map((c) => {
    const dirs = c.stars.map(([ra, dec]) => starDir(ra, dec));
    c.stars.forEach(([, , mag, col], i) => {
      const s = { p: dirs[i].clone().multiplyScalar(C_R), c: new THREE.Color(col || '#f4f3ff'), tw: 0.25 };
      if (mag < 1.4) cBrightList.push({ ...s, size: 12 + (1.4 - mag) * 5 });
      else cDimList.push({ ...s, c: s.c.multiplyScalar(THREE.MathUtils.clamp(1.25 - mag * 0.14, 0.5, 1)), size: THREE.MathUtils.clamp(9 - mag * 1.5, 2.2, 6.5) });
    });
    // Each line stops short of its stars, so the stars stay points and the figure reads as drawn between them.
    const pos = [];
    c.lines.forEach(([a, b]) => { const A = dirs[a], B = dirs[b], k = Math.min(0.3, 0.014 / A.angleTo(B)); pos.push(...A.clone().lerp(B, k).multiplyScalar(C_R - 2).toArray(), ...B.clone().lerp(A, k).multiplyScalar(C_R - 2).toArray()); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: '#b8ccff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const line = new THREE.LineSegments(geo, mat); line.frustumCulled = false; line.renderOrder = -8.5; line.visible = false; cGroup.add(line);
    disposables.push(geo, mat);
    return { id: c.id, dirs, lines: c.lines, mat, line, a: 0 };
  });
  const cDim = points(cDimList, STAR_F, px), cBright = points(cBrightList, BRIGHT_F, px, { spikes: { value: 1 } });
  cDim.renderOrder = -9; cBright.renderOrder = -8; cGroup.add(cDim, cBright); starMats.push(cDim.material, cBright.material);
  disposables.push(cDim.geometry, cDim.material, cBright.geometry, cBright.material);
  let skyHover = null, skySel = null;

  /* Shooting stars: a pool of thin glowing streaks, spawned inside the view. */
  const meteorGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]), 2)); g.setIndex([0, 2, 1, 2, 3, 1]); return g; };
  const METEOR_TINTS = ['#ffffff', '#ffffff', '#d8e6ff', '#b8ffd8', '#ffd7a0'];
  const meteors = Array.from({ length: 10 }, () => {
    const m = new THREE.Mesh(meteorGeo(), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { tint: { value: new THREE.Color() }, a: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 tint; uniform float a; varying vec2 vUv; void main(){ float along = vUv.x, across = vUv.y; float w = exp(-across * across * 5.0); float k = pow(along, 2.4) * w + smoothstep(0.9, 1.0, along) * exp(-across * across * 2.0) * 0.8; vec3 c = mix(tint, vec3(1.0), smoothstep(0.75, 1.0, along)); gl_FragColor = vec4(c, k * a); }' }));
    m.visible = false; m.frustumCulled = false; m.renderOrder = -6; group.add(m);
    return { mesh: m, live: false, head: new THREE.Vector3(), dir: new THREE.Vector3(), speed: 0, len: 0, life: 0, max: 1, delay: 0 };
  });
  const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _s = new THREE.Vector3(), _t = new THREE.Vector3(), _v = new THREE.Vector3();
  function viewBasis() { camera.updateMatrixWorld(); _r.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); _u.setFromMatrixColumn(camera.matrixWorld, 1).normalize(); camera.getWorldDirection(_f); }
  function launchMeteor(start, dir, delay) {
    const m = meteors.find(x => !x.live); if (!m) return;
    Object.assign(m, { live: true, life: 0, delay, max: rand(0.45, 1.05), speed: rand(55, 95), len: rand(7, 16) });
    m.head.copy(start); m.dir.copy(dir).normalize();
    m.mesh.material.uniforms.tint.value.set(METEOR_TINTS[Math.floor(Math.random() * METEOR_TINTS.length)]);
  }
  function spawnMeteors() {
    viewBasis();
    const ndc = new THREE.Vector3(rand(-0.85, 0.85), rand(-0.15, 0.9), 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(80);
    const ang = rand(-2.7, -0.45), dir = _r.clone().multiplyScalar(Math.cos(ang)).addScaledVector(_u, Math.sin(ang));
    const shower = Math.random() < 0.18 ? Math.floor(rand(3, 6)) : 1;
    for (let i = 0; i < shower; i++) {
      // A shower leaves from one radiant: same direction, starts spread round it.
      const s = ndc.clone().addScaledVector(_r, gauss() * 6 * (i ? 1 : 0)).addScaledVector(_u, gauss() * 4 * (i ? 1 : 0));
      launchMeteor(s, dir.clone().addScaledVector(_r, gauss() * 0.05), i * rand(0.12, 0.3));
    }
  }
  function stepMeteor(m, dt) {
    if (m.delay > 0) { m.delay -= dt; return; }
    m.life += dt; m.head.addScaledVector(m.dir, m.speed * dt);
    const k = m.life / m.max, len = m.len * Math.min(1, m.life * 6) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 * 0.6 : 1);
    _t.copy(m.head).addScaledVector(m.dir, -len);
    _s.crossVectors(m.dir, _v.copy(m.head).normalize()).normalize().multiplyScalar(0.11);
    const a = m.mesh.geometry.attributes.position;
    a.setXYZ(0, _t.x - _s.x, _t.y - _s.y, _t.z - _s.z); a.setXYZ(1, _t.x + _s.x, _t.y + _s.y, _t.z + _s.z);
    a.setXYZ(2, m.head.x - _s.x, m.head.y - _s.y, m.head.z - _s.z); a.setXYZ(3, m.head.x + _s.x, m.head.y + _s.y, m.head.z + _s.z); a.needsUpdate = true;
    m.mesh.material.uniforms.a.value = Math.min(1, m.life * 8, (m.max - m.life) * 4);
    m.mesh.visible = true;
    if (m.life >= m.max) { m.live = false; m.mesh.visible = false; }
  }
  let nextMeteor = 1.5;

  /* One comet at a time, and a quiet one: a small bright coma, a faint straight ion tail and a soft dust tail that
     fans out, both pointing away from the Sun as seen in the sky. It appears in open sky in the upper part of the
     view, never over the planet, and only where its tail cannot reach the controls; it drifts very slowly and
     fades after about a minute. */
  const coma = glowTexture([[0, 'rgba(255,255,255,1)'], [0.1, 'rgba(210,255,238,0.8)'], [0.35, 'rgba(120,230,195,0.18)'], [1, 'rgba(0,0,0,0)']]);
  disposables.push(coma);
  const TAIL_V = 'attribute float alpha; attribute float size; attribute vec3 color; uniform float px; uniform float fade; varying float vA; varying vec3 vC; void main(){ vA = alpha * fade; vC = color; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * px; gl_Position = projectionMatrix * p; }';
  const TAIL_F = 'varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 3.5) * vA; if (a < 0.004) discard; gl_FragColor = vec4(vC, a); }';
  function makeComet() {
    const L = rand(9, 12), n = mobile ? 380 : 700;
    const pos = new Float32Array(n * 3), alpha = new Float32Array(n), size = new Float32Array(n), col = new Float32Array(n * 3);
    const ion = new THREE.Color('#9cc8ff'), dust = new THREE.Color('#ffe9cc');
    for (let i = 0; i < n; i++) {
      const isIon = i < n * 0.25, s = Math.pow(Math.random(), isIon ? 0.85 : 0.7);
      // Local frame: +x away from the Sun, +y towards where the comet came from (the dust tail bends that way).
      const x = s * L * (isIon ? 1.1 : 0.85), y = isIon ? gauss() * 0.04 * (0.3 + s) : s * s * L * 0.18 + gauss() * (0.1 + s * 0.9) * 0.3, z = gauss() * (isIon ? 0.04 : 0.3) * (0.3 + s);
      pos.set([x, y, z], i * 3);
      // Thin right at the head, where the particles overlap; the ion tail is the fainter of the two.
      alpha[i] = Math.pow(1 - s, isIon ? 1.2 : 1.6) * rand(0.12, 0.32) * (isIon ? 0.6 : 1) * (0.3 + 0.7 * Math.min(1, s / 0.1));
      size[i] = rand(5, 12) * (0.6 + s * 1.2);
      const c = isIon ? ion : dust; col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const tailMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { px: { value: px }, fade: { value: 0 } }, vertexShader: TAIL_V, fragmentShader: TAIL_F });
    const tail = new THREE.Points(g, tailMat); tail.frustumCulled = false;
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: coma, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0 }));
    head.scale.setScalar(rand(2.2, 2.8));
    const obj = new THREE.Group(); obj.add(tail); obj.add(head); obj.renderOrder = -6; obj.visible = false; group.add(obj);
    return { obj, tail, head, tailMat, L, dir: new THREE.Vector3(), axis: new THREE.Vector3(), w: 0, life: 0, max: 1, live: false };
  }
  const comet = makeComet();
  let cometWait = 6;
  const _e = new THREE.Vector3(), _h = new THREE.Vector3(), _td = new THREE.Vector3(), _d = new THREE.Vector3();
  // Where a sky point (relative to the camera) lands on screen, in -1..1.
  const onScreen = (local) => _e.copy(local).add(camera.position).project(camera).clone();
  function placeComet(c) {
    camera.updateMatrixWorld(); viewBasis();
    // The planet's disc on screen, a little enlarged: the comet keeps out of it.
    const dist = camera.position.length(), ang = Math.asin(Math.min(1, (R * 1.25) / dist));
    const ry = Math.tan(ang) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), rx = ry / camera.aspect;
    const ctr = new THREE.Vector3().project(camera);
    const overPlanet = (p) => ((p.x - ctr.x) / rx) ** 2 + ((p.y - ctr.y) / ry) ** 2 < 1;
    for (let k = 0; k < 60; k++) {
      const x = rand(-0.85, 0.85), y = rand(0.15, 0.62);
      _d.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
      _td.copy(sunDir).negate().projectOnPlane(_d); if (_td.lengthSq() < 1e-6) continue; _td.normalize();
      _h.copy(_d).multiplyScalar(150);
      const head = { x, y }, mid = onScreen(_h.clone().addScaledVector(_td, c.L * 0.5)), end = onScreen(_h.clone().addScaledVector(_td, c.L));
      // Inside the view, clear of the planet, and the whole tail above the dock and below the region strip.
      if (end.z > 1 || Math.abs(end.x) > 0.92 || end.y < -0.1 || end.y > 0.7) continue;
      if (overPlanet(head) || overPlanet(mid) || overPlanet(end)) continue;
      // And not beside the Moon, so each keeps its own patch of sky.
      const mo = onScreen(moon.position);
      if (mo.z < 1 && Math.hypot(head.x - mo.x, head.y - mo.y) < 0.35) continue;
      c.dir.copy(_d);
      c.axis.crossVectors(_d, _u).normalize();
      Object.assign(c, { w: rand(0.0008, 0.0015), life: 0, max: rand(55, 80), live: true });
      return true;
    }
    return false;
  }
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _vel = new THREE.Vector3();
  function stepComet(c, dt, still) {
    if (!still) { c.life += dt; c.dir.applyAxisAngle(c.axis, c.w * dt); }
    c.obj.position.copy(c.dir).multiplyScalar(150);
    // Tail away from the Sun as it looks in the sky: the anti-Sun direction laid flat on the sky at the comet, so the
    // tail never points straight at or away from the reader (the Sun here sits behind the camera). The dust tail
    // curls back along the path.
    _x.copy(sunDir).negate().projectOnPlane(c.dir);
    if (_x.lengthSq() < 1e-6) _x.crossVectors(c.dir, c.axis); _x.normalize();
    _vel.crossVectors(c.axis, c.dir);
    _y.copy(_vel).negate().projectOnPlane(_x); if (_y.lengthSq() < 1e-6) _y.set(0, 1, 0).projectOnPlane(_x); _y.normalize();
    _z.crossVectors(_x, _y);
    c.obj.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
    const f = still ? 1 : Math.min(1, c.life / 6, (c.max - c.life) / 6);
    c.tailMat.uniforms.fade.value = f; c.head.material.opacity = f;
    c.obj.visible = f > 0.002;
    if (c.life >= c.max) { c.live = false; c.obj.visible = false; }
  }

  /* Auroras round the geomagnetic poles (about 80.7° N 72.7° W and its antipode), in the scene, not the sky. */
  const auroraMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { t: { value: 0 }, fade: { value: 1 } },
    vertexShader: 'attribute float along; attribute float h; varying float vAl; varying float vH; void main(){ vAl = along; vH = h; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float t; uniform float fade; varying float vAl; varying float vH;
      void main(){
        float rays = 0.45 + 0.3 * sin(vAl * 1130.0 + sin(vAl * 140.0 + t * 0.35) * 3.0 + t * 0.6) + 0.25 * sin(vAl * 1790.0 - t * 0.9 + sin(vAl * 61.0) * 4.0);
        rays *= 0.6 + 0.4 * sin(vAl * 260.0 + sin(vAl * 23.0 + t * 0.12) * 5.0);
        float wave = 0.5 + 0.5 * sin(vAl * 38.0 - t * 0.22 + sin(vAl * 11.0 + t * 0.17) * 2.4);
        float vert = smoothstep(0.0, 0.1, vH) * pow(1.0 - vH, 1.5);
        vec3 c = mix(vec3(0.3, 1.0, 0.62), vec3(0.78, 0.38, 1.0), smoothstep(0.38, 0.95, vH));
        gl_FragColor = vec4(c, vert * (0.25 + 0.75 * wave) * rays * fade * 0.5); }` });
  const toV = (lat, lon) => { const p = THREE.MathUtils.degToRad(lat), l = THREE.MathUtils.degToRad(lon); return new THREE.Vector3(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)); };
  function auroraRing(pole, colat, seed) {
    const M = 320, a1 = new THREE.Vector3(0, 1, 0).cross(pole).normalize(), a2 = new THREE.Vector3().crossVectors(pole, a1);
    const pos = new Float32Array((M + 1) * 2 * 3), along = new Float32Array((M + 1) * 2), h = new Float32Array((M + 1) * 2), idx = [];
    for (let i = 0; i <= M; i++) {
      const th = (i / M) * TAU, cl = THREE.MathUtils.degToRad(colat + 2.6 * Math.sin(2 * th + seed) + 1.3 * Math.sin(5 * th + seed * 2) + 0.6 * Math.sin(11 * th));
      const d = pole.clone().multiplyScalar(Math.cos(cl)).addScaledVector(a1, Math.sin(cl) * Math.cos(th)).addScaledVector(a2, Math.sin(cl) * Math.sin(th));
      [R + 0.04, R + 0.13].forEach((r, k) => { pos.set([d.x * r, d.y * r, d.z * r], (i * 2 + k) * 3); along[i * 2 + k] = i / M; h[i * 2 + k] = k; });
      if (i < M) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('along', new THREE.BufferAttribute(along, 1)); g.setAttribute('h', new THREE.BufferAttribute(h, 1)); g.setIndex(idx);
    const m = new THREE.Mesh(g, auroraMat); m.renderOrder = 2; return m;
  }
  const auroras = new THREE.Group(); auroras.name = 'auroras';
  auroras.add(auroraRing(toV(80.7, -72.7), 21, 1.3), auroraRing(toV(-80.7, 107.3), 20, 4.1));
  scene.add(auroras);

  /* Terra (NASA): the satellite whose MODIS sensor gives the vegetation case files their greenness (NDVI) and every
     case file its true-colour images. A model after NASA's own drawings of it, on a near-polar orbit drawn higher
     than the real one so it can be seen: a long body wrapped in gold foil with dark blue radiator panels on its
     sides; the five instruments on the deck that faces the ground (MODIS and its cooler, MISR's nine cameras fanned
     along the track, ASTER's telescopes, the two CERES scanners turning, MOPITT); the dish that talks to the relay
     satellites, on its mast; and its one long solar wing, which turns to face the same Sun that lights the planet.
     A faint ring shows the orbit and a short trail its way. Pointing at it lights up the orbit and the strip of
     ground MODIS sweeps below it; a tap opens its card and the camera rides along behind it (see follow, below).
     It fades away as the camera comes down, so it never stands between the reader and a tile. */
  const terra = new THREE.Group(); terra.name = 'terra';
  const U = 0.017;
  const sr = seeded(1999);
  const canvasTex = (w, h, draw, srgb = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; disposables.push(t); return t;
  };
  // Crinkled foil: patches of light and shade with fine creases. The same picture shades the colour and the bump.
  const foilMap = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 280; i++) {
      const x = sr() * w, y = sr() * h, r = 6 + sr() * 26, v = Math.round(175 + sr() * 80);
      g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath();
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + sr() * 0.9, rr = r * (0.5 + sr() * 0.7); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(50,50,50,0.45)'; g.lineWidth = 1;
    for (let i = 0; i < 90; i++) { const x = sr() * w, y = sr() * h, a = sr() * TAU, l = 8 + sr() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  }, false);
  // Radiator panels: dark blue tiles in a light frame, as in NASA's pictures of the spacecraft.
  const radMap = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#b9c3d8'; g.fillRect(0, 0, w, w);
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = sr() * 16; g.fillStyle = `rgb(${30 + v},${40 + v},${96 + v * 2})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
  });
  // Solar cells with silver lines between them, and the panels' ribbed back.
  const cellMap = canvasTex(128, 288, (g, w, h) => {
    g.fillStyle = '#c3cbdb'; g.fillRect(0, 0, w, h);
    const cx = 4, cy = 9, sw = w / cx, sh = h / cy;
    for (let i = 0; i < cx; i++) for (let j = 0; j < cy; j++) {
      const gr = g.createLinearGradient(i * sw, j * sh, (i + 1) * sw, (j + 1) * sh); gr.addColorStop(0, '#3448a8'); gr.addColorStop(1, '#1c2774');
      g.fillStyle = gr; g.fillRect(i * sw + 1.5, j * sh + 1.5, sw - 3, sh - 3);
    }
    g.fillStyle = '#dfe4ee'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
  });
  const backMap = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#d6d9e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8f97a5'; for (let y = 8; y < h; y += 16) g.fillRect(0, y, w, 2); g.fillRect(w / 2 - 1, 0, 2, h); });
  // What the metal reflects: dark space above, the bright blue planet below, a hint of the Sun.
  const envTex = canvasTex(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0b0f1a'); gr.addColorStop(0.4, '#2a3550'); gr.addColorStop(0.5, '#e6f0ff'); gr.addColorStop(0.6, '#8fb6e6'); gr.addColorStop(1, '#3d5f8f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = g.createRadialGradient(70, 34, 0, 70, 34, 44); s.addColorStop(0, 'rgba(255,250,235,1)'); s.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = s; g.fillRect(20, 0, 110, 90);
  });
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer), envMap = pmrem.fromEquirectangular(envTex).texture; pmrem.dispose(); disposables.push(envMap);
  const mat = (o) => { const m = new THREE.MeshStandardMaterial({ envMap, envMapIntensity: 0.9, ...o }); disposables.push(m); return m; };
  const gold = mat({ color: '#f2b544', map: foilMap, bumpMap: foilMap, bumpScale: 0.45, metalness: 0.9, roughness: 0.26, emissive: '#3a2406', envMapIntensity: 1.5 });
  const silver = mat({ color: '#e4e6ea', map: foilMap, bumpMap: foilMap, bumpScale: 0.45, metalness: 0.7, roughness: 0.3, emissive: '#2a2c31', envMapIntensity: 0.9 });
  const rad = mat({ map: radMap, metalness: 0.35, roughness: 0.4, emissive: '#0b1230' });
  const paint = mat({ color: '#eceef2', metalness: 0.1, roughness: 0.6, emissive: '#16181d', side: THREE.DoubleSide });
  const strut = mat({ color: '#a9b0bb', metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
  const glass = mat({ color: '#10141c', metalness: 0.6, roughness: 0.15 });
  const black = mat({ color: '#07080b', metalness: 0.2, roughness: 0.8 });
  const cells = mat({ map: cellMap, metalness: 0.45, roughness: 0.28, emissive: '#16245e', emissiveIntensity: 0.55 });
  const back = mat({ map: backMap, metalness: 0.3, roughness: 0.55 });
  // Parts are placed in units of U. Local frame: +z towards the ground (nadir), +y along the track, +x across it.
  const put = (geo, m, x, y, z, parent = terra) => { const o = new THREE.Mesh(geo, m); o.position.set(x * U, y * U, z * U); parent.add(o); return o; };
  const box = (w, h, d, m, x, y, z, parent) => put(new THREE.BoxGeometry(w * U, h * U, d * U), m, x, y, z, parent);
  // A cylinder with its axis along x, y or z.
  const cyl = (r, len, m, x, y, z, axis = 'z', parent, seg = 16) => {
    const o = put(new THREE.CylinderGeometry(r * U, r * U, len * U, seg), m, x, y, z, parent);
    if (axis === 'x') o.rotation.z = Math.PI / 2; else if (axis === 'z') o.rotation.x = Math.PI / 2;
    return o;
  };
  // The body ([+x, −x, +y, −y, +z, −z]), the bands between its modules, a foil module and a white radiator on top.
  put(new THREE.BoxGeometry(2.6 * U, 5.6 * U, 2.6 * U), [rad, rad, gold, gold, silver, gold], 0, 0, 0);
  for (const y of [-1.9, -0.25, 1.4]) box(2.68, 0.1, 2.68, gold, 0, y, 0);
  box(2.2, 2.3, 0.4, gold, 0.1, 1.25, -1.5);
  box(1.9, 1.6, 0.12, paint, -0.1, -1.3, -1.36);
  // The propulsion module at the back with its four thrusters; a smaller module and two star trackers at the front.
  box(2.0, 0.8, 2.0, gold, 0, -3.2, 0);
  for (const [sx, sz] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) put(new THREE.ConeGeometry(0.15 * U, 0.32 * U, 10, 1, true), strut, sx, -3.76, sz);
  box(2.1, 0.6, 2.1, gold, 0, 3.1, 0.1);
  for (const x of [-0.55, 0.55]) { const s = cyl(0.17, 0.5, black, x, 2.9, -1.55, 'z'); s.rotation.x += x * 0.6; }
  // The deck facing the ground. Right of the track: MODIS (its scan opening, and the cooler that faces cold space),
  // ASTER's thermal box, its visible-light telescope and its short-wave cylinder. Left: MOPITT, MISR and its nine
  // cameras, each looking at the ground from another angle. At the front, the two CERES scanners.
  box(1.2, 1.5, 0.9, paint, 0.55, -1.5, 1.75);
  box(0.7, 0.9, 0.04, black, 0.55, -1.5, 2.21);
  const cooler = put(new THREE.ConeGeometry(0.5 * U, 0.55 * U, 4, 1, true), paint, 1.42, -1.5, 1.75); cooler.rotation.z = Math.PI / 2;
  box(0.8, 0.6, 0.6, silver, 0.7, -0.35, 1.6); cyl(0.16, 0.2, glass, 0.7, -0.35, 2.0, 'z');
  box(0.7, 0.7, 0.7, paint, 0.75, 0.45, 1.65); cyl(0.24, 0.45, glass, 0.75, 0.45, 2.15, 'z');
  cyl(0.3, 0.95, paint, 0.7, 1.35, 1.72, 'x');
  box(0.9, 1.1, 0.6, silver, -0.65, -1.6, 1.6); cyl(0.2, 0.35, glass, -0.65, -1.6, 2.05, 'z');
  box(1.1, 1.7, 0.7, gold, -0.6, 0.35, 1.65);
  for (let i = 0; i < 9; i++) { const c = cyl(0.09, 0.3, glass, -0.6, 0.35 + (i - 4) * 0.18, 2.08, 'z', terra, 10); c.rotation.x += (i - 4) * 0.17; }
  const ceres = [-0.65, 0.65].map((x, k) => {
    cyl(0.06, 0.35, strut, x, 2.3, 1.45, 'z', terra, 8);
    const head = new THREE.Group(); head.position.set(x * U, 2.3 * U, 1.88 * U); head.rotation.z = k * 1.3; terra.add(head);
    cyl(0.3, 0.55, paint, 0, 0, 0, 'x', head);
    box(0.5, 0.07, 0.05, black, 0, 0, 0.3, head);
    return head;
  });
  // The dish that sends the data up to the relay satellites, on its mast, and a whip antenna.
  cyl(0.07, 2.0, strut, -0.7, -2.2, -2.3, 'z', terra, 8);
  box(0.34, 0.34, 0.34, strut, -0.7, -2.2, -3.38);
  const dish = put(new THREE.LatheGeometry(Array.from({ length: 9 }, (_, i) => new THREE.Vector2((i / 8) * 0.95 * U, (i / 8) ** 2 * 0.32 * U)), 28), paint, -0.7, -2.2, -3.6);
  dish.rotation.x = -Math.PI / 2 + 0.4;
  put(new THREE.CylinderGeometry(0.03 * U, 0.03 * U, 0.5 * U, 6), strut, 0, 0.25, 0, dish);
  cyl(0.025, 1.4, strut, 1.0, -2.6, -2.0, 'z', terra, 6);
  // The wing: a yoke out of the body's side, then five panels; it turns on the yoke so its cells (the panels' +y
  // face) look at the Sun.
  const wingPivot = new THREE.Group(); wingPivot.position.set(1.3 * U, 1.3 * U, -0.6 * U); terra.add(wingPivot);
  cyl(0.09, 1.2, strut, 0.6, 0, 0, 'x', wingPivot, 8);
  box(0.32, 0.32, 0.32, strut, 0.05, 0, 0, wingPivot);
  for (let i = 0; i < 5; i++) put(new THREE.BoxGeometry(1.6 * U, 0.06 * U, 3.6 * U), [strut, strut, cells, back, strut, strut], 2.02 + i * 1.66, 0, 0, wingPivot);
  cyl(0.05, 8.3, strut, 5.35, -0.08, 0, 'x', wingPivot, 6);
  // A soft blink on the body, so the eye can find it against the stars.
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(190,225,255,0.5)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true }));
  beacon.scale.setScalar(6 * U); beacon.position.z = -1.6 * U; disposables.push(beacon.material.map); terra.add(beacon);
  // A larger invisible ball makes it easy to point at or tap.
  const terraHit = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  terra.add(terraHit);
  scene.add(terra);

  const TERRA_R = R * 1.5, TERRA_I = THREE.MathUtils.degToRad(98.2);
  const orbU = new THREE.Vector3(1, 0, 0), orbV = new THREE.Vector3(0, Math.sin(TERRA_I), Math.cos(TERRA_I));
  const orbitAt = (a, r = TERRA_R, out = new THREE.Vector3()) => out.copy(orbU).multiplyScalar(Math.cos(a) * r).addScaledVector(orbV, Math.sin(a) * r);
  // The orbit ring and a short fading trail behind the satellite.
  const ringPts = Array.from({ length: 257 }, (_, i) => orbitAt((i / 256) * TAU));
  const ringMat = new THREE.LineDashedMaterial({ color: '#9fd0ff', dashSize: 0.025, gapSize: 0.02, transparent: true, opacity: 0.14, depthWrite: false });
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat); ring.computeLineDistances(); ring.renderOrder = 3;
  const TRAIL = 48, trailPos = new Float32Array(TRAIL * 3), trailCol = new Float32Array(TRAIL * 3);
  for (let i = 0; i < TRAIL; i++) { const k = Math.pow(1 - i / (TRAIL - 1), 1.6); trailCol.set([0.62 * k, 0.82 * k, 1.0 * k], i * 3); }
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
  const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 });
  const trail = new THREE.Line(trailGeo, trailMat); trail.frustumCulled = false; trail.renderOrder = 3;
  // The strip of ground MODIS sweeps: a thin fan from the satellite down to the planet, across the track.
  const SWATH = 0.18;   // half its width on the ground, in radii (MODIS sees a strip about 2,300 km wide)
  const fanGeo = new THREE.BufferGeometry();
  fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 3), 3));
  fanGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0.5, 1, 0, 0, 1, 0]), 2));
  const fanMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { a: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float a; varying vec2 vUv; void main(){ float edge = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 6.0); gl_FragColor = vec4(vec3(0.55, 0.85, 1.0), a * (0.12 + 0.3 * (1.0 - vUv.y)) * edge); }' });
  const fan = new THREE.Mesh(fanGeo, fanMat); fan.frustumCulled = false; fan.renderOrder = 4; fan.visible = false;
  const terraPath = new THREE.Group(); terraPath.name = 'terraPath'; terraPath.add(ring, trail, fan); scene.add(terraPath);
  let terraA = 0.7, terraScale = 0, terraHover = false, terraSel = false, terraGlow = 0;
  // Follow: with its card open the camera rides behind the satellite. followT ramps 0..1 over FOLLOW_S seconds; the
  // page reads it eased (followWeight) to blend its own camera into the chase view and back.
  const FOLLOW_S = 1.8;
  let follow = false, followT = 0;
  const smooth = (x) => x * x * (3 - 2 * x);
  const followW = () => (visible ? smooth(followT) : 0);
  const _sl = new THREE.Vector3(), _q = new THREE.Quaternion(), _tx = new THREE.Vector3(), _ty = new THREE.Vector3(), _tz = new THREE.Vector3(), _tm = new THREE.Matrix4(), _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3(), _op = new THREE.Vector3();
  // Moves the satellite on and the follow ramp; called first in each frame, so the camera and the model agree.
  function advance(dt) {
    const still = reduced();
    if (visible && !still) terraA += dt * (TAU / 110);   // one orbit in about two minutes, calm enough to follow
    const want = follow && visible ? 1 : 0;
    followT = still ? want : THREE.MathUtils.clamp(followT + (want ? dt : -dt) / FOLLOW_S, 0, 1);
  }
  // Where the satellite is and how it faces: position, along the track, up (away from the planet), across.
  function orbitFrame(p, fwd, up, side) {
    orbitAt(terraA, TERRA_R, p); up.copy(p).normalize();
    fwd.copy(orbV).multiplyScalar(Math.cos(terraA)).addScaledVector(orbU, -Math.sin(terraA)).normalize();
    side.crossVectors(fwd, up).negate().normalize();
  }
  function stepTerra(dt, t, still, alt) {
    orbitAt(terraA, TERRA_R, terra.position);
    // Body: nadir down, along the track, the wing across it.
    _tz.copy(terra.position).normalize().negate();
    _ty.copy(orbV).multiplyScalar(Math.cos(terraA)).addScaledVector(orbU, -Math.sin(terraA)).normalize();
    _tx.crossVectors(_ty, _tz).normalize();
    terra.quaternion.setFromRotationMatrix(_tm.makeBasis(_tx, _ty, _tz));
    // The wing turns on its boom so its face, the pivot's +y, points at the Sun.
    _sl.copy(sunDir).applyQuaternion(_q.copy(terra.quaternion).invert());
    wingPivot.rotation.x = Math.atan2(_sl.z, _sl.y);
    // Close to the ground it fades out, unless the camera is riding with it.
    const fw = followW(), ts = Math.max(THREE.MathUtils.smoothstep(alt, 0.75, 1.3), fw); terraScale = ts;
    terra.scale.setScalar(Math.max(ts, 1e-4)); terra.visible = ts > 0.01; terraPath.visible = ts > 0.01;
    beacon.material.opacity = (1 - fw) * (still ? 0.7 : 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 6));
    if (!still) ceres.forEach((h, k) => { h.rotation.z += dt * (k ? -0.9 : 0.7); });   // the CERES scanners sweep
    // Trail: the last stretch of the orbit behind it.
    for (let i = 0; i < TRAIL; i++) { orbitAt(terraA - i * 0.012, TERRA_R, _op); trailPos.set([_op.x, _op.y, _op.z], i * 3); }
    trailGeo.attributes.position.needsUpdate = true;
    // Pointing at it, or its open card, lights the orbit and the swath.
    const want = terraHover || terraSel ? 1 : 0;
    terraGlow += (want - terraGlow) * (still ? 1 : 1 - Math.pow(0.001, dt));
    // Riding behind it, the ring and the trail would run through the camera: they all but fade.
    ringMat.opacity = (0.14 + 0.36 * terraGlow) * ts * (1 - 0.7 * fw); trailMat.opacity = 0.8 * ts * (1 - 0.9 * fw);
    fanMat.uniforms.a.value = terraGlow * ts;
    fan.visible = terraGlow > 0.01;
    if (fan.visible) {
      const p = terra.position;
      _g1.copy(p).addScaledVector(_tz, TERRA_R - R).addScaledVector(_tx, SWATH).normalize().multiplyScalar(R * 1.01);
      _g2.copy(p).addScaledVector(_tz, TERRA_R - R).addScaledVector(_tx, -SWATH).normalize().multiplyScalar(R * 1.01);
      const a = fanGeo.attributes.position; a.setXYZ(0, p.x, p.y, p.z); a.setXYZ(1, _g1.x, _g1.y, _g1.z); a.setXYZ(2, _g2.x, _g2.y, _g2.z); a.needsUpdate = true;
    }
  }
  // What the card and the tooltip say. Every fact is about the satellite itself, from NASA's Terra mission pages.
  const INFO = {
    terra: {
      kind: say('Satélite de la NASA', 'NASA satellite'), title: 'Terra',
      tip: say('Su sensor MODIS da el verdor y las imágenes de los expedientes.', 'Its MODIS sensor gives the case files their greenness and images.'),
      facts: [
        say('Su sensor MODIS mide el verdor (NDVI) de los expedientes de vegetación.', 'Its MODIS sensor measures the greenness (NDVI) in the vegetation case files.'),
        say('También toma las imágenes en color real que ves «desde la órbita» en cada expediente.', 'It also takes the true-colour images you see “from orbit” in each case file.'),
        say('Va de polo a polo; con la Tierra girando debajo, MODIS ve todo el planeta cada 1 o 2 días.', 'It runs pole to pole; as the Earth turns below, MODIS sees the whole planet every 1 or 2 days.'),
        say('Está en órbita desde 1999.', 'It has been in orbit since 1999.'),
      ],
      src: say('Ilustración: la órbita está dibujada más alta de lo real y no muestra la posición de hoy.', "Illustration: the orbit is drawn higher than it really is and does not show today's position."),
      link: { href: 'https://terra.nasa.gov/', label: say('Conocer Terra en la NASA', 'About Terra at NASA') },
    },
  };
  // The constellations' cards: what the figure is, three things worth knowing, its brightest star and where it shows.
  const C_SRC = say('Sus estrellas están en su lugar real respecto de la Tierra y a esta hora: la Polar queda sobre el polo norte y la Cruz del Sur hacia el polo sur. El resto del cielo es ilustrativo.',
    'Its stars are in their real places around the Earth at this hour: the Pole Star sits over the North Pole and the Southern Cross towards the South Pole. The rest of the sky is illustrative.');
  CONSTELLATIONS.forEach((c) => {
    INFO[c.id] = { kind: say('Constelación', 'Constellation'), title: say(...c.name), tip: say(...c.lead), facts: c.facts.map((f) => say(...f)), src: C_SRC,
      meta: [[say('Estrella más brillante', 'Brightest star'), say(...c.star)], [say('Se ve mejor desde', 'Best seen from'), say(...c.seen)]] };
  });
  // The Moon's card says today's real phase, so it is built when asked for. After the three taps it adds Apollo 11.
  function moonInfo() {
    const ph = moonPhase(Date.now()), name = say(ph.name[1], ph.name[2]), pct = Math.round(ph.lit * 100);
    return {
      kind: say('Satélite natural', 'Natural satellite'), title: say('La Luna', 'The Moon'),
      tip: say(`El único satélite natural de la Tierra. Hoy: ${name.toLowerCase()}.`, `The Earth's only natural satellite. Today: ${name.toLowerCase()}.`),
      facts: [
        say(`Hoy se ve ${name.toLowerCase()}, iluminada al ${pct} % (aprox.).`, `Today it shows as a ${name.toLowerCase()}, ${pct}% lit (approx.).`),
        say('Está a 384.400 km en promedio: entre las dos caben unas 30 Tierras en fila.', 'It is 384,400 km away on average: about 30 Earths would fit in a row between the two.'),
        say('Mide 3.474 km de diámetro, poco más de un cuarto de la Tierra.', 'It is 3,474 km across, a little over a quarter of the Earth.'),
        say('Siempre nos muestra la misma cara: gira sobre sí misma en lo mismo que tarda en dar la vuelta a la Tierra, 27,3 días.', 'It always shows us the same face: it turns once on itself in the time it takes to go round the Earth, 27.3 days.'),
        say('Su gravedad mueve las mareas de los océanos.', 'Its gravity drives the ocean tides.'),
      ],
      src: say('Ilustración: en el globo la Luna está mucho más cerca y es más grande de lo real, y no está en su lugar de hoy. La fase de hoy sí es la real.', 'Illustration: on the globe the Moon is much closer and bigger than it really is, and not where it is today. Today\'s phase is the real one.'),
      link: { href: 'https://science.nasa.gov/moon/', label: say('Conocer la Luna en la NASA', 'About the Moon at NASA') },
      extra: apollo ? {
        title: say('Apolo 11 · 20 de julio de 1969', 'Apollo 11 · 20 July 1969'),
        facts: [
          say('Encontraste el lugar del primer alunizaje: la marca dorada en la Luna.', 'You found the site of the first Moon landing: the golden mark on the Moon.'),
          say('El módulo Eagle se posó en el Mar de la Tranquilidad.', 'The Eagle lander set down in the Sea of Tranquillity.'),
          say('Neil Armstrong y Buzz Aldrin caminaron unas dos horas y media por la superficie; Michael Collins los esperaba en órbita.', 'Neil Armstrong and Buzz Aldrin walked the surface for about two and a half hours; Michael Collins waited for them in orbit.'),
          say('Dejaron un espejo que todavía se usa para medir con láser la distancia a la Luna.', 'They left a mirror that is still used to measure the distance to the Moon with lasers.'),
        ],
        link: { href: 'https://www.nasa.gov/mission/apollo-11/', label: say('La misión Apolo 11 en la NASA', 'The Apollo 11 mission at NASA') },
      } : null,
    };
  }

  let visible = true;
  function setVisible(v) { visible = v; group.visible = v; auroras.visible = v; terra.visible = v; terraPath.visible = v; if (!v) { meteors.forEach(m => { m.live = false; m.mesh.visible = false; }); terraHover = terraSel = follow = false; skyHover = skySel = null; apolloLbl.visible = false; } }
  // The Moon's halo, the constellations' figures and the Apollo mark, eased towards what is pointed at or open.
  function stepCuriosities(dt, t, still) {
    const k = still ? 1 : 1 - Math.pow(0.002, dt);
    cGroup.rotation.y = -gmst(Date.now());
    cons.forEach((c) => {
      const want = skyHover === c.id || skySel === c.id ? 0.7 : 0;
      c.a += (want - c.a) * k; if (Math.abs(want - c.a) < 0.005) c.a = want;
      c.mat.opacity = c.a; c.line.visible = c.a > 0;
    });
    moonLit += ((skyHover === 'moon' || skySel === 'moon' ? 1 : 0) - moonLit) * k;
    moonGlow.scale.setScalar(9 + 4 * moonLit);
    apolloDot.visible = apollo;
    if (!apollo) return;
    apolloDot.scale.setScalar(still ? 0.7 : 0.62 + 0.16 * (0.5 + 0.5 * Math.sin(t * 3)));
    // The label is a page element, so the planet does not hide it by itself: it shows only while the Moon is in sight.
    _hidden.set(camera.position, _w.copy(apolloDot.position).normalize());
    apolloLbl.visible = !_hidden.intersectsSphere(_earth);
    // Near the right edge the name goes on the Moon's other side, so it never runs off the screen.
    const flip = _w.copy(apolloDot.position).add(camera.position).project(camera).x > 1 - 340 / innerWidth;
    // Flipped, it clears the whole disc: the Moon's radius on screen, from its fixed distance and the camera's view.
    const disc = (MOON_R / MOON_D / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * (innerHeight / 2);
    apolloLbl.center.x = flip ? 1 : 0; apolloEl.style.marginLeft = flip ? `-${Math.round(disc * 1.4 + 8)}px` : ''; apolloEl.classList.toggle('is-flip', flip);
  }

  // Called once per frame, after the Sun has been placed for this frame.
  function update(dt, t) {
    const still = reduced();
    group.position.copy(camera.position);
    sunDir.copy(sun.position).sub(sun.target.position).normalize();
    starMats.forEach(m => { m.uniforms.t.value = t; m.uniforms.moving.value = still ? 0 : 1; });
    if (!visible) return;
    const alt = camera.position.length() - R;
    // Meteors
    if (!still) {
      nextMeteor -= dt; if (nextMeteor <= 0) { spawnMeteors(); nextMeteor = rand(1.2, 3.6); }
      meteors.forEach(m => { if (m.live) stepMeteor(m, dt); });
    }
    // The comet: waits, appears in open sky, drifts and fades; with reduced motion it stands still where it appears.
    if (!comet.live) { cometWait -= dt; if (cometWait <= 0) cometWait = placeComet(comet) ? rand(30, 60) : 2; }
    if (comet.live) stepComet(comet, dt, still);
    // Auroras: full from afar, gone near the ground so they never stand between the reader and a tile.
    auroraMat.uniforms.fade.value = THREE.MathUtils.smoothstep(alt, 0.35, 0.8);
    auroras.visible = auroraMat.uniforms.fade.value > 0.01;
    if (!still) auroraMat.uniforms.t.value = t;
    stepTerra(dt, t, still, alt);
    stepCuriosities(dt, t, still);
  }

  // The satellite under a ray, if it is shown and large enough to point at.
  function pick(ray) {
    if (!visible || !terra.visible || terraScale < 0.5) return null;
    terra.updateMatrixWorld(true);   // it moved this frame; the last render's matrix may lag
    return ray.intersectObject(terraHit, false).length ? 'terra' : null;
  }
  // The Moon or a constellation under the pointer (x, y in CSS pixels): the Moon by its disc, a little enlarged, and a
  // constellation when the pointer is within slop pixels of one of its lines. The page asks only once the ray has
  // missed the planet and everything on it, so the sky never takes a tap meant for a case file.
  const _fwd = new THREE.Vector3(), _w = new THREE.Vector3(), _pt = new THREE.Vector2();
  function onScreenAt(dir, out) {
    _w.copy(dir).applyQuaternion(cGroup.quaternion);
    if (_w.dot(_fwd) < 0.05) return null;
    _w.multiplyScalar(C_R).add(camera.position).project(camera);
    return out.set(((_w.x + 1) / 2) * innerWidth, ((1 - _w.y) / 2) * innerHeight);
  }
  function pickSky(raycaster, x, y, slop = 12) {
    if (!visible) return null;
    moon.getWorldPosition(moonHit.center);
    if (raycaster.ray.intersectsSphere(moonHit)) return 'moon';
    camera.getWorldDirection(_fwd); _pt.set(x, y);
    let best = null, bestD = slop;
    cons.forEach((c) => {
      const at = c.dirs.map((d) => onScreenAt(d, new THREE.Vector2()));
      c.lines.forEach(([a, b]) => { if (!at[a] || !at[b]) return; const d = segDist(_pt, at[a], at[b]); if (d < bestD) { bestD = d; best = c.id; } });
    });
    return best;
  }
  const isCuriosity = (id) => id === 'moon' || cons.some((c) => c.id === id);
  function setHover(id) { terraHover = id === 'terra'; skyHover = isCuriosity(id) ? id : null; }
  // Selecting the satellite (its card opens) also starts the ride behind it; unfollow ends the ride and keeps it lit.
  // The Moon and the constellations only stay lit while their card is open.
  function select(id) { terraSel = follow = id === 'terra'; skySel = isCuriosity(id) ? id : null; }
  function unfollow() { follow = false; }
  const following = () => follow && visible;
  const info = (id) => (id === 'moon' ? moonInfo() : INFO[id] || null);
  // The Apollo 11 mark, found with three taps on the Moon; it stays for the visit.
  function setApollo(on) { apollo = !!on; if (!apollo) apolloLbl.visible = false; }

  function dispose() {
    rt.dispose(); disposables.forEach(d => d.dispose());
    terra.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    scene.remove(group); scene.remove(auroras); scene.remove(terra); scene.remove(terraPath);
  }

  return { group, update, advance, setVisible, dispose, pick, pickSky, setHover, select, unfollow, following, followWeight: followW, orbitFrame, info, setApollo, apollo: () => apollo };
}

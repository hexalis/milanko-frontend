/* The sky around the 3D world: decoration only, never data. Nothing here is drawn from NASA figures and nothing
   here can be picked; it only sets the scene the Earth turns in.

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
   - The Moon, lit by that same Sun, so its phase agrees with the light on the planet.
   - Auroras round both geomagnetic poles, where they really are.
   - NASA's Terra satellite on a near-polar orbit: the MODIS images and vegetation data in the case files come
     from it, so it is the one satellite drawn. Its orbit is out of scale, like the relief; pointing at it shows
     its orbit and the strip of ground it sweeps, and a tap opens a card that says what it does for the portal.

   The sky group follows the camera's position (not its turn), so stars stay at infinity: they never slide as the
   planet turns under the finger. Reduced motion stills everything: no twinkle, no shooting stars, the comets
   and auroras hold their place. */
import * as THREE from 'three';

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
  const moonMap = moonTexture();
  const moonMat = new THREE.ShaderMaterial({ uniforms: { map: { value: moonMap }, sunDir: { value: sunDir } },
    vertexShader: 'varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 sunDir; varying vec3 vN; varying vec2 vUv; void main(){ float l = dot(normalize(vN), sunDir); float lit = smoothstep(-0.04, 0.25, l) * (0.35 + 0.75 * max(l, 0.0)); vec3 tex = texture2D(map, vUv).rgb; gl_FragColor = vec4(tex * lit + vec3(0.012, 0.02, 0.035) * (1.0 - lit), 1.0); }' });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), moonMat);
  moon.position.copy(moonDir).multiplyScalar(90); moon.rotation.y = Math.PI * 0.5; moon.renderOrder = -7; group.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(220,230,255,0.28)'], [0.35, 'rgba(170,190,255,0.08)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  moonGlow.scale.setScalar(9); moonGlow.position.copy(moon.position).multiplyScalar(1.02); moonGlow.renderOrder = -7.5; group.add(moonGlow);
  disposables.push(moonMap, moonGlow.material.map);

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
     case file its true-colour images. A small model on a near-polar orbit, drawn higher than its real orbit so it
     can be seen: a gold-foil body, a white instrument deck facing the ground, and its single solar wing, which
     turns to face the same Sun that lights the planet. A faint ring shows the orbit and a short trail its way.
     Pointing at it lights up the orbit and the strip of ground MODIS sweeps below it; a tap opens its card.
     It fades away as the camera comes down, so it never stands between the reader and a tile. */
  const terra = new THREE.Group(); terra.name = 'terra';
  const U = 0.017;
  function wingTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 96); gr.addColorStop(0, '#3d63c4'); gr.addColorStop(1, '#2a4a9e'); g.fillStyle = gr; g.fillRect(0, 0, 256, 96);
    g.strokeStyle = 'rgba(190,215,255,0.55)'; g.lineWidth = 1.5;
    for (let x = 0; x <= 256; x += 16) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 96); g.stroke(); }
    for (let y = 0; y <= 96; y += 12) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(256, y + 0.5); g.stroke(); }
    g.fillStyle = 'rgba(200,215,240,0.6)'; g.fillRect(0, 0, 256, 3); g.fillRect(0, 93, 256, 3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const wingMap = wingTexture(); disposables.push(wingMap);
  const foil = new THREE.MeshStandardMaterial({ color: '#d3a650', metalness: 0.75, roughness: 0.32, emissive: '#2a1d06' });
  const deck = new THREE.MeshStandardMaterial({ color: '#e9ecf2', metalness: 0.2, roughness: 0.55, emissive: '#1a1d24' });
  const cellsM = new THREE.MeshStandardMaterial({ map: wingMap, metalness: 0.3, roughness: 0.35, emissive: '#1c3270', emissiveIntensity: 0.6, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: '#555b66', metalness: 0.6, roughness: 0.4 });
  // Local frame: +z towards the ground (nadir), +y along the track, +x across it (the wing's side).
  const bus = new THREE.Mesh(new THREE.BoxGeometry(2.2 * U, 1.8 * U, 3.4 * U), foil);
  const instr = new THREE.Mesh(new THREE.BoxGeometry(1.8 * U, 1.4 * U, 0.9 * U), deck); instr.position.z = 2.1 * U;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * U, 0.34 * U, 0.4 * U, 14), dark); lens.rotation.x = Math.PI / 2; lens.position.set(0.4 * U, 0.2 * U, 2.7 * U);
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.55 * U, 0.4 * U, 18, 1, true), deck); dish.rotation.x = -Math.PI / 2; dish.position.set(-0.6 * U, -0.6 * U, -2.0 * U);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * U, 0.08 * U, 2.4 * U, 6), dark); boom.rotation.z = Math.PI / 2; boom.position.x = 2.3 * U;
  // The wing hangs on a pivot that turns about the boom (x); its face points along the pivot's +y.
  const wingPivot = new THREE.Group(); wingPivot.position.x = 3.5 * U;
  const wing = new THREE.Mesh(new THREE.PlaneGeometry(6.6 * U, 2.6 * U), cellsM); wing.position.x = 3.3 * U; wing.rotation.x = -Math.PI / 2;
  wingPivot.add(wing);
  terra.add(bus, instr, lens, dish, boom, wingPivot);
  // A soft blink on the body, so the eye can find it against the stars.
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(190,225,255,0.5)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true }));
  beacon.scale.setScalar(7 * U); disposables.push(beacon.material.map); terra.add(beacon);
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
  const _sl = new THREE.Vector3(), _q = new THREE.Quaternion(), _tx = new THREE.Vector3(), _ty = new THREE.Vector3(), _tz = new THREE.Vector3(), _tm = new THREE.Matrix4(), _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3(), _op = new THREE.Vector3();
  function stepTerra(dt, t, still, alt) {
    if (!still) terraA += dt * (TAU / 110);   // one orbit in about two minutes, calm enough to follow
    orbitAt(terraA, TERRA_R, terra.position);
    // Body: nadir down, along the track, the wing across it.
    _tz.copy(terra.position).normalize().negate();
    _ty.copy(orbV).multiplyScalar(Math.cos(terraA)).addScaledVector(orbU, -Math.sin(terraA)).normalize();
    _tx.crossVectors(_ty, _tz).normalize();
    terra.quaternion.setFromRotationMatrix(_tm.makeBasis(_tx, _ty, _tz));
    // The wing turns on its boom so its face, the pivot's +y, points at the Sun.
    _sl.copy(sunDir).applyQuaternion(_q.copy(terra.quaternion).invert());
    wingPivot.rotation.x = Math.atan2(_sl.z, _sl.y);
    const ts = THREE.MathUtils.smoothstep(alt, 0.75, 1.3); terraScale = ts;
    terra.scale.setScalar(Math.max(ts, 1e-4)); terra.visible = ts > 0.01; terraPath.visible = ts > 0.01;
    beacon.material.opacity = still ? 0.7 : 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 6);
    // Trail: the last stretch of the orbit behind it.
    for (let i = 0; i < TRAIL; i++) { orbitAt(terraA - i * 0.012, TERRA_R, _op); trailPos.set([_op.x, _op.y, _op.z], i * 3); }
    trailGeo.attributes.position.needsUpdate = true;
    // Pointing at it, or its open card, lights the orbit and the swath.
    const want = terraHover || terraSel ? 1 : 0;
    terraGlow += (want - terraGlow) * (still ? 1 : 1 - Math.pow(0.001, dt));
    ringMat.opacity = (0.14 + 0.36 * terraGlow) * ts; trailMat.opacity = 0.8 * ts;
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

  let visible = true;
  function setVisible(v) { visible = v; group.visible = v; auroras.visible = v; terra.visible = v; terraPath.visible = v; if (!v) { meteors.forEach(m => { m.live = false; m.mesh.visible = false; }); terraHover = terraSel = false; } }

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
  }

  // The satellite under a ray, if it is shown and large enough to point at.
  function pick(ray) {
    if (!visible || !terra.visible || terraScale < 0.5) return null;
    terra.updateMatrixWorld(true);   // it moved this frame; the last render's matrix may lag
    return ray.intersectObject(terraHit, false).length ? 'terra' : null;
  }
  function setHover(id) { terraHover = id === 'terra'; }
  function select(id) { terraSel = id === 'terra'; }
  const info = (id) => INFO[id] || null;

  function dispose() {
    rt.dispose(); disposables.forEach(d => d.dispose());
    scene.remove(group); scene.remove(auroras); scene.remove(terra); scene.remove(terraPath);
  }

  return { group, update, setVisible, dispose, pick, setHover, select, info };
}

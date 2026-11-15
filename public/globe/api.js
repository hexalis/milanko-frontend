/* Thin client for hexalis/api-processor.
   The portal is served next to the API on the VPS, so the default is same-origin /api/v1.
   On GitHub Pages (or any static host) it falls back to the production API, and then
   to the local snapshots in data/ when no API answers. A deployment can override the
   base with ?api=..., <meta name="etd-api-base"> or window.ETD_API_BASE. */
const ETD_API = (() => {
  const runtime = window.ETD_CONFIG || {};
  const environment = runtime.environment || "local";
  const params = new URLSearchParams(location.search);
  const meta = document.querySelector('meta[name="etd-api-base"]')?.content || "";
  const configured = window.ETD_API_BASE || runtime.apiBase || "";
  const sameOrigin = location.protocol.startsWith("http") ? "/api/v1" : "";
  const onGithubPages = /\.github\.io$/i.test(location.hostname);
  const githubPages = onGithubPages ? "https://milanko.hexalis.org/api/v1" : "";
  // On GitHub Pages there is no /api next to the page; try production first and
  // skip a guaranteed 404. On the VPS the same-origin API wins.
  const preferred = onGithubPages ? [githubPages, sameOrigin] : [sameOrigin, githubPages];
  const candidates = [...new Set([params.get("api"), meta, configured, ...preferred].filter(Boolean))];

  let base = null;
  let status = "local";
  let info = null;
  let probing = null;

  const timeout = (ms) => (AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);
  const clean = (value) => value.replace(/\/+$/, "");

  async function detect() {
    if (probing) return probing;
    probing = (async () => {
      for (const candidate of candidates) {
        const root = clean(candidate);
        try {
          const res = await fetch(`${root}/health`, {
            headers: { Accept: "application/json" },
            signal: timeout(4000),
          });
          if (!res.ok) continue;
          const body = await res.json();
          if (body?.status !== "ok") continue;
          // /health stays public while the data needs an X-API-Key the browser cannot hold. A
          // healthy API that refuses its data is no API for the portal: use the snapshots.
          const data = await fetch(`${root}/world/meta.json`, { signal: timeout(4000) });
          if (!data.ok) continue;
          base = root;
          status = "api";
          info = body;
          break;
        } catch (e) { /* try the next candidate */ }
      }
      return { base, status, info };
    })();
    return probing;
  }

  function url(path) {
    return base ? `${base}${path}` : null;
  }

  async function json(path, opts = {}) {
    const target = url(path);
    if (!target) throw new Error("API unavailable");
    const res = await fetch(target, { ...opts, signal: opts.signal || timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // api-processor returns flat category ids and snake_case geometry; the portal
  // already understands NASA EONET's raw shape, so normalize at the edge.
  function toEonet(event) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      link: event.link,
      closed: event.closed,
      categories: (event.categories || []).map((category) =>
        typeof category === "string" ? { id: category, title: category } : category),
      sources: event.sources || [],
      geometry: (event.geometry || []).map((geometry) => ({
        date: geometry.date,
        type: geometry.type,
        coordinates: geometry.coordinates,
        magnitudeValue: geometry.magnitude_value ?? geometry.magnitudeValue ?? null,
        magnitudeUnit: geometry.magnitude_unit ?? geometry.magnitudeUnit ?? "",
      })),
    };
  }

  async function events(query = {}) {
    const search = new URLSearchParams();
    const entries = query instanceof URLSearchParams ? query.entries() : Object.entries(query);
    for (const [key, value] of entries) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    const body = await json(`/events?${search}`);
    return { ...body, events: (body.events || []).map(toEonet) };
  }

  async function event(id) {
    return toEonet(await json(`/events/${encodeURIComponent(id)}`));
  }

  async function regions() {
    return json("/regions");
  }

  async function regionObservations(code, query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/${encodeURIComponent(code)}/observations?${search}`);
  }

  async function regionSnapshot(query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/snapshot?${search}`);
  }

  async function regionEvents(code, query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/${encodeURIComponent(code)}/events?${search}`);
  }

  async function eventMap(query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/events/map?${search}`);
  }

  async function eventContext(id) {
    return json(`/events/${encodeURIComponent(id)}/context`);
  }

  async function regionRankings(query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/rankings?${search}`);
  }

  async function regionLatest(code, query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/${encodeURIComponent(code)}/latest?${search}`);
  }

  async function regionTrends(code, query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/${encodeURIComponent(code)}/trends?${search}`);
  }

  async function regionAnomalies(code, query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/regions/${encodeURIComponent(code)}/anomalies?${search}`);
  }

  async function coverage(source = "") {
    const search = new URLSearchParams();
    if (source) search.set("source", source);
    return json(`/data/coverage?${search}`);
  }

  async function eventStats(query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/events/stats?${search}`);
  }

  async function persistedEvents(query = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    }
    return json(`/events/persisted?${search}`);
  }

  function world(path) {
    return url(`/world/${String(path).replace(/^\/+/, "")}`);
  }

  function snapshot(lat, lon, date, { km = 220, px = 480 } = {}) {
    if (!base) return null;
    // The API accepts km 20..2000 and px 64..1024; thumbnails in the portal ask
    // for 48 px, so clamp instead of turning a valid image into a 422.
    const safeKm = Math.max(20, Math.min(2000, Number(km) || 220));
    const safePx = Math.max(64, Math.min(1024, Number(px) || 480));
    const search = new URLSearchParams({ lat, lon, km: safeKm, px: safePx });
    if (date) search.set("date", date);
    return `${base}/world/snapshot?${search}`;
  }

  function docs() {
    return base ? `${base}/docs` : null;
  }

  return {
    detect,
    get base() { return base; },
    get status() { return status; },
    get info() { return info; },
    get environment() { return environment; },
    url,
    json,
    events,
    event,
    regions,
    regionObservations,
    regionSnapshot,
    regionRankings,
    regionEvents,
    eventContext,
    eventMap,
    regionLatest,
    regionTrends,
    regionAnomalies,
    coverage,
    eventStats,
    persistedEvents,
    world,
    snapshot,
    docs,
  };
})();

window.ETD_API = ETD_API;

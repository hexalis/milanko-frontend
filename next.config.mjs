const DEFAULT_API_URL = "https://dev-milanko.hexalis.org/api/v1";

/*
 * The browser always calls the same-origin /api/v1. In deployed environments nginx proxies
 * /api/ to the backend of that environment before the request reaches Next, so this rewrite
 * only takes effect locally (and anywhere Next serves /api/v1 itself).
 */
const apiUrl = (process.env.MILANKO_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

/*
 * Deploys mount the app at /app so the landing page can own the root. Local development and the
 * e2e suite leave it empty. Next prefixes pages, links and assets by itself; raw URLs (iframes,
 * fetches, downloads) go through src/shared/lib/base-path.ts.
 */
const basePath = (process.env.NEXT_BASE_PATH || "").replace(/\/+$/, "");
if (basePath && !basePath.startsWith("/")) {
  throw new Error("NEXT_BASE_PATH must be empty or start with /");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async rewrites() {
    // nginx serves /api before Next; keep the rewrite at the root even when the app is under /app.
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/:path*`, basePath: false }];
  },
  /*
   * /explore embeds the POC globe (public/globe) in a sandboxed iframe with an opaque origin, so
   * its module script and data fetches are cross-origin requests to this server. The files are
   * public static data; no credentials are involved.
   */
  async headers() {
    return [
      {
        source: "/globe/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          /*
           * nginx sends `X-Frame-Options: DENY` on every response (milanko-backend
           * ops/vps/nginx/milanko.conf), which also blocks /explore from framing its own globe.
           * Browsers ignore X-Frame-Options when frame-ancestors is present, so the globe may be
           * framed by this site and by no other.
           */
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      // The globe asks the API first (public, read-only GET). In deploys nginx serves /api, so the
      // same header must be set there; without it the globe falls back to its data snapshot.
      {
        source: "/api/v1/:path*",
        basePath: false,
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;

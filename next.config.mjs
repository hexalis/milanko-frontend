const DEFAULT_API_URL = "https://dev-milanko.hexalis.org/api/v1";

/*
 * The browser always calls the same-origin /api/v1. In deployed environments nginx proxies
 * /api/ to the backend of that environment before the request reaches Next, so this rewrite
 * only takes effect locally (and anywhere Next serves /api/v1 itself).
 */
const apiUrl = (process.env.MILANKO_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;

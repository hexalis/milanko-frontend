/*
 * Deploys mount the app at /app (NEXT_BASE_PATH) while local development and e2e keep it at the
 * root. Next prefixes next/link, next/form, router and redirect() by itself; use this helper for
 * the raw same-origin URLs Next does not touch: iframes, fetches, downloads and replaceState.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBasePath = (path: string): string => `${basePath}${path}`;

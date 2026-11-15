# The app is built on the GitHub runner (`pnpm build` with NEXT_BASE_PATH=/app); this
# image only packages the standalone output, so it builds in seconds and stays small.
FROM node:24-slim AS runner

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

ARG NEXT_BASE_PATH=/app
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH

WORKDIR /app

COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000' + (process.env.NEXT_BASE_PATH || '/')).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]

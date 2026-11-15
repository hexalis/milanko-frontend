# Deployment

The frontend is a **Next.js server** (not a static export). The pipeline builds a
Docker image on the VPS and runs it behind nginx.

## Pipeline

`.github/workflows/pipeline.yml` is self-contained; it does not call
`hexalis/github-workflows`.

- **Test**: Node 24, pnpm, `pnpm check`, `pnpm build`, Playwright and a Docker
  image build.
- **Deploy**: only on `push`/`workflow_dispatch` to `develop`, `qa` or `main`.
  The job is also gated on `package.json` `name === "milanko-frontend"`, so the
  template app on `main` is never deployed.
- **Production**: deploys automatically on `main`; the `production` Environment only has the `main` branch policy.

## GitHub Environments

Create `develop`, `qa` and `production` with the branch policies
`develop`, `qa` and `main`. Production no longer requires reviewers.

### Variables

| Variable                | develop                                 | qa                                 | production                                 |
| ----------------------- | --------------------------------------- | ---------------------------------- | ------------------------------------------ |
| `MILANKO_API_URL`       | `http://milanko-api-develop:8000`       | `http://milanko-api-qa:8000`       | `http://milanko-api-production:8000`       |
| `APP_ENV`               | `develop`                               | `qa`                               | `production`                               |
| `DEPLOY_USER`           | `deploy`                                | `deploy`                           | `deploy`                                   |
| `DEPLOY_SSH_PORT`       | `22`                                    | `22`                               | `22`                                       |
| `DEPLOY_REMOTE_PATH`    | `/home/deploy/milanko-frontend-develop` | `/home/deploy/milanko-frontend-qa` | `/home/deploy/milanko-frontend-production` |
| `DEPLOY_CONTAINER`      | `milanko-web-develop`                   | `milanko-web-qa`                   | `milanko-web-production`                   |
| `DEPLOY_IMAGE_TAG`      | `milanko-web:develop`                   | `milanko-web:qa`                   | `milanko-web:production`                   |
| `DEPLOY_PORTS`          | `127.0.0.1:8021:3000`                   | `127.0.0.1:8022:3000`              | `127.0.0.1:8023:3000`                      |
| `DEPLOY_ENV_FILE`       | `/etc/milanko/frontend-develop.env`     | `/etc/milanko/frontend-qa.env`     | `/etc/milanko/frontend-production.env`     |
| `DEPLOY_DOCKER_NETWORK` | `milanko`                               | `milanko`                          | `milanko`                                  |
| `DEPLOY_HEALTH_URL`     | `http://127.0.0.1:8021/`                | `http://127.0.0.1:8022/`           | `http://127.0.0.1:8023/`                   |
| `DEPLOY_USE_SUDO`       | `false`                                 | `false`                            | `false`                                    |
| `PUBLIC_BASE_URL`       | `https://dev-milanko.hexalis.org`       | `https://qa-milanko.hexalis.org`   | `https://milanko.hexalis.org`              |

### Secrets

| Secret               | Description                             |
| -------------------- | --------------------------------------- |
| `DEPLOY_HOST`        | VPS IP / host; stored as a secret       |
| `DEPLOY_SSH_KEY`     | Private key for the `deploy` user       |
| `DEPLOY_KNOWN_HOSTS` | Pinned `known_hosts` line               |
| `MILANKO_API_KEY`    | `public-web` API key (server-side only) |

## Server

The runtime env file is `/etc/milanko/frontend-<env>.env`, `root:deploy 0640`:

```dotenv
MILANKO_API_URL=http://milanko-api-<env>:8000
APP_ENV=<env>
MILANKO_API_KEY=<public-web key>
```

The container is:

```bash
docker run -d \
  --name milanko-web-<env> \
  --restart unless-stopped \
  --network milanko \
  -p 127.0.0.1:<8021|8022|8023>:3000 \
  --env-file /etc/milanko/frontend-<env>.env \
  --log-opt max-size=50m \
  --log-opt max-file=3 \
  milanko-web:<env>
```

The internal `MILANKO_API_URL` removes the need to send `X-API-Key` from the
Next server. If the public API URL is used instead, the server must send
`X-API-Key: $MILANKO_API_KEY`.

nginx root must proxy to the container; the current backend configuration uses
a placeholder fallback when the container is down. See
[`docs/server-processes.md`](https://github.com/hexalis/milanko-backend/blob/main/docs/server-processes.md)
in the backend repository.

## Local

```bash
corepack enable
pnpm install --frozen-lockfile
MILANKO_API_URL=https://dev-milanko.hexalis.org/api/v1 \
APP_ENV=develop \
pnpm dev
```

For a local public API call, add the `X-API-Key` header from the
`MILANKO_API_KEY` secret; the deployed internal URL does not need it.

## Rollback

Each deploy leaves `milanko-web:<env>` and `milanko-web:<env>-<sha>`. Run the
previous SHA tag with the same env file, network and port to roll back. The
pipeline also keeps the previous container image on the VPS until the next
prune.

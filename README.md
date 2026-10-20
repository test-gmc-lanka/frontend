# GMC Lanka – Frontend

[![CI/CD Pipeline](https://github.com/test-gmc-lanka/frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/test-gmc-lanka/frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/test-gmc-lanka/frontend/branch/develop/graph/badge.svg)](https://codecov.io/gh/test-gmc-lanka/frontend)

Web client for the GMC Lanka system: product catalogue, cart and Stripe checkout, appointments,
and the admin and technician dashboards. Part of the [test-gmc-lanka](https://github.com/test-gmc-lanka)
project; the API lives in the [backend](https://github.com/test-gmc-lanka/backend) repository.

**Staging:** _add the staging URL here once deployed_

## Tech stack

React 18 · React Router 6 · Vite 8 · Axios · Stripe Elements · Vitest + Testing Library · ESLint 9 + Prettier

## Prerequisites

- Node.js 22.12 or later (`.nvmrc` pins 22) and npm 10
- The backend running on `http://localhost:8080` for local development
- Docker (only to build or run the production image)

No environment variables are needed for local development. See [.env.example](.env.example) for
the variables the Docker image reads.

## Getting started

```bash
git clone https://github.com/test-gmc-lanka/frontend.git
cd frontend
git checkout develop
npm ci
npm run dev
```

Open http://localhost:5173. Requests to `/api` and `/uploads` are proxied to the backend on port 8080.

## Scripts

| Command                    | What it does                                          |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Start the dev server with hot reload                  |
| `npm run build`            | Production build into `dist/`                         |
| `npm run preview`          | Serve the production build locally                    |
| `npm run lint`             | ESLint (Airbnb-aligned rules, see `eslint.config.js`) |
| `npm run format`           | Format all files with Prettier                        |
| `npm run format:check`     | Fail if any file is not formatted                     |
| `npm test`                 | Vitest in watch mode                                  |
| `npm run test:unit`        | Unit tests once                                       |
| `npm run test:integration` | Integration tests (`*.int.test.js`)                   |
| `npm run test:coverage`    | All tests with a coverage report in `coverage/`       |

## Running with Docker

```bash
docker build -t gmc-frontend .
docker run --rm -p 8081:80 -e BACKEND_URL=http://host.docker.internal:8080 gmc-frontend
```

Then open http://localhost:8081. nginx serves the app and forwards `/api` and `/uploads` to `BACKEND_URL`.

## Testing

- Unit tests sit next to the code they test (`*.test.js`, `*.test.jsx`) and follow Arrange-Act-Assert
  with "should … given …" names.
- Integration tests (`*.int.test.js`) exercise the real Axios client and its token-refresh interceptors
  against a scripted backend.
- Coverage thresholds (80%) are enforced per file in `vite.config.js` and will be widened as more of
  the code is covered.

## CI/CD

The pipeline in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs:

| Stage               | Trigger                                      |
| ------------------- | -------------------------------------------- |
| Lint & Format       | Every push and PR                            |
| Build               | Every push and PR                            |
| Unit Tests          | Every push and PR (coverage report uploaded) |
| Integration Tests   | Push to `develop`, PR to `develop`           |
| Security Scan       | Push to `develop`/`main`, PRs                |
| Deploy – Staging    | Merge to `develop`                           |
| Deploy – Production | Merge to `main`, after manual approval       |

Deploys build a Docker image, push it to `ghcr.io/test-gmc-lanka/frontend`, and call the hosting
provider's deploy hook. A production deploy also creates the `vX.Y.Z` release tag from the version in
`package.json`.

## Branching and commits

- `main` – production, protected; `develop` – integration branch (default)
- `feature/<issue>-<slug>`, `fix/<issue>-<slug>`, `hotfix/<slug>`, `release/<version>`
- Conventional Commits, e.g. `feat(cart): show stock warning` with `Closes #42` in the body

# --- Build stage: install exact locked deps and produce the static bundle ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Runtime stage: nginx serves the SPA and proxies /api and /uploads to the backend ---
FROM nginx:1.27-alpine
# The nginx image runs envsubst on /etc/nginx/templates/*.template at start-up, so
# BACKEND_URL and PORT are read when the container starts (one image for staging and production).
ENV BACKEND_URL=http://backend:8080 \
    PORT=80
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" || exit 1

# App (PWA) lista para producción: se compila con Node y se sirve con nginx.
# nginx también reenvía /api, /health y /powersync a los servicios internos,
# así todo funciona desde un solo dominio.

# Contexto de build: la raíz del repo, porque la app importa los esquemas de contracts/.
FROM node:22-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY contracts /app/contracts
COPY frontend /app/frontend

# Rutas relativas: la app usa el mismo dominio desde el que se abre.
ARG VITE_DATA_MODE=api
ARG VITE_API_BASE_URL=/
ARG VITE_POWERSYNC_ENABLED=true
ARG VITE_POWERSYNC_URL=/powersync
ARG VITE_DEMO_DATA=false
ENV VITE_DATA_MODE=$VITE_DATA_MODE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_POWERSYNC_ENABLED=$VITE_POWERSYNC_ENABLED \
    VITE_POWERSYNC_URL=$VITE_POWERSYNC_URL \
    VITE_DEMO_DATA=$VITE_DEMO_DATA
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

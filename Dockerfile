# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Las variables VITE_* se fijan en tiempo de build (sobrescriben el .env).
ARG VITE_USE_MOCK=false
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_AUTH_URL=/auth/login
ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_URL=$VITE_AUTH_URL
RUN npm run build

# ---------- Runtime: nginx sirve la SPA y hace de reverse proxy al backend ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

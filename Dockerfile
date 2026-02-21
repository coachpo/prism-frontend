FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@10.30.1 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE=http://localhost:8000
ENV VITE_API_BASE=${VITE_API_BASE}

RUN pnpm run build

FROM nginx:alpine AS runner

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 3000; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /healthz { \
        access_log off; \
        return 200 "{\"ok\":true}"; \
        add_header Content-Type application/json; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

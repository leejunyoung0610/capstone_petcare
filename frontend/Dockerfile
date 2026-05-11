# ── 1단계: 빌드 ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 배포 시 VITE_API_URL 을 빌드 arg 로 주입 → 번들에 하드코딩됨
ARG VITE_API_URL
ARG VITE_KAKAO_MAP_KEY
ARG VITE_AI_SERVER_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY
ENV VITE_AI_SERVER_URL=$VITE_AI_SERVER_URL

COPY . .
RUN rm -f .env .env.local .env.*.local && npm run build

# ── 2단계: 서빙 (nginx) ───────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS builder

WORKDIR /app

# Deployment locale — inlined into client bundles as NEXT_PUBLIC_APP_LOCALE
ARG APP_LOCALE=en
ENV NEXT_PUBLIC_APP_LOCALE=$APP_LOCALE

COPY layers/dashboard/package*.json ./
RUN npm ci

COPY layers/dashboard/ .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts

EXPOSE 4000

ENV PORT=4000
CMD ["sh", "-c", "node scripts/init-admin-password.js || true && npm start"]

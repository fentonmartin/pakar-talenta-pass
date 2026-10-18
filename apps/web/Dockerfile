FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN ls packages/*/package.json | while read f; do mkdir -p "$(dirname "$f"/src)" 2>/dev/null; done
RUN npm install 2>/dev/null || npm install --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY packages ./packages
COPY package.json ./
WORKDIR /app/apps/web
RUN npm run build 2>/dev/null || npx next build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -S www-data -G www-data

USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "server.js"]

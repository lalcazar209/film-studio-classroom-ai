# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy values so `next build` can statically evaluate config/env access —
# no live database or vendor credentials are required to produce a build.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/film_studio_classroom_ai"
ENV DIRECT_URL="postgresql://postgres:postgres@localhost:5432/film_studio_classroom_ai"
ENV AUTH_SECRET="build-time-placeholder-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
RUN npm run build

# Lean runtime image: only the standalone server + its traced dependencies,
# not the full node_modules tree or dev tooling from the builder stage.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next's file-tracing doesn't always pick up Prisma's query-engine binary;
# copying the generated client explicitly is the standard workaround.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

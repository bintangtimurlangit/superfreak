FROM node:22.17.0-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Prefer pnpm when pnpm-lock.yaml exists. Else npm: use install (not ci) so build works when lock is out of sync.
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optional: scripts + node_modules for one-off tools (e.g. test-midtrans-verify)
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
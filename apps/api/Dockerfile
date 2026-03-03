FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# ── Dependencies ─────────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/

RUN pnpm install --frozen-lockfile --prod=false

# ── Build ────────────────────────────────────────
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN pnpm exec nx run api:build

# ── Production ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]

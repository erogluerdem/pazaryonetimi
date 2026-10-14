FROM postgres:16-bookworm AS postgres_tools
FROM node:22-slim AS base
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    libpq5 \
    liblz4-1 \
    libzstd1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=postgres_tools /usr/lib/postgresql/16/bin/pg_dump /usr/local/bin/pg_dump
COPY --from=postgres_tools /usr/lib/postgresql/16/bin/pg_restore /usr/local/bin/pg_restore
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune --scope=@pazaryonetimi/api --docker

FROM base AS builder
WORKDIR /app
# Base already contains build tools

# Copy pruned package files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install all dependencies (including dev for building)
RUN npm install --legacy-peer-deps --ignore-scripts

# Handle special native modules if they exist (--ignore-scripts: prisma schema not copied yet)
RUN npm install --no-save napi-postinstall --ignore-scripts && \
    if [ -d node_modules/unrs-resolver ]; then npm rebuild unrs-resolver; fi

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Prisma client + database package build (dist/generated/client)
RUN npm run db:generate && npm run build --workspace=@pazaryonetimi/database

# Build API directly (database already built; turbo would re-run prisma generate)
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build --workspace=@pazaryonetimi/api

FROM base AS runner
# Base already contains runtime libraries

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PRISMA_CLIENT_ENGINE_TYPE="library"
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

# Create unprivileged user
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 nestjs
RUN mkdir -p /home/nestjs/.puppeteer_data && chown -R nestjs:nodejs /home/nestjs

# Workspace package manifests
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Reuse builder's pruned node_modules and workspaces
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

# Fix permissions
RUN chown -R nestjs:nodejs /app

USER nestjs
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules
EXPOSE 3001

# Start the application with an automatic database sync and seeding
CMD ["sh", "-c", "cd packages/database && ../../node_modules/.bin/prisma db push --skip-generate && mkdir -p ../../node_modules/.prisma/client && cp -r ./generated/client/. ../../node_modules/.prisma/client/ && npm run db:seed && cd ../../apps/api && node dist/apps/api/src/main.js"]



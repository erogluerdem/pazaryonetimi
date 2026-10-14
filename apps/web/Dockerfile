FROM node:22-slim AS base
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune --scope=@pazaryonetimi/web --docker

FROM base AS builder
WORKDIR /app
# Base already contains build tools

# Copy pruned package files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies
RUN npm install --legacy-peer-deps --ignore-scripts

# Handle special native modules (--ignore-scripts: prisma schema not copied yet)
RUN npm install --no-save napi-postinstall --ignore-scripts && \
    if [ -d node_modules/unrs-resolver ]; then npm rebuild unrs-resolver; fi

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build-time args for Next.js
ARG DATABASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG API_INTERNAL_URL
ARG API_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client + build database package (dist/generated/client)
RUN npm run db:generate --prefix . && npm run build --workspace=@pazaryonetimi/database

# Build web (database + prisma already prepared above)
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build --workspace=@pazaryonetimi/web

FROM base AS runner
# Base already contains runtime libraries

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Create unprivileged user
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Monorepo: standalone output does not include workspace links / Prisma externals
COPY --from=builder --chown=nextjs:nodejs /app/packages/database ./packages/database
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@pazaryonetimi ./node_modules/@pazaryonetimi
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/xtend ./node_modules/xtend
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/split2 ./node_modules/split2
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/driver-adapter-utils ./node_modules/@prisma/driver-adapter-utils
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

RUN mkdir -p node_modules/@pazaryonetimi && \
    ln -sfn ../../packages/database node_modules/@pazaryonetimi/database && \
    chown -h nextjs:nodejs node_modules/@pazaryonetimi/database && \
    mkdir -p apps/web/.next/server/chunks && \
    ln -sfn /app/packages/database/generated apps/web/.next/server/chunks/generated && \
    ln -sfn /app/packages/database/generated apps/web/.next/server/generated && \
    chown -h nextjs:nodejs apps/web/.next/server/chunks/generated apps/web/.next/server/generated

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]


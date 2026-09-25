# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache ca-certificates openssl

FROM base AS dependencies
ARG NPM_REGISTRY=https://registry.npmjs.org
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS migration-dependencies
# Standalone supplies app dependencies; keep only Prisma migration tooling here.
RUN node -e "const fs = require('node:fs'); \
    const pkg = require('./package.json'); \
    pkg.dependencies = { prisma: pkg.dependencies.prisma, dotenv: pkg.dependencies.dotenv }; \
    delete pkg.devDependencies; \
    fs.writeFileSync('package.json', JSON.stringify(pkg));" \
    && npm prune --omit=dev --omit=peer --ignore-scripts --no-audit --no-fund

FROM dependencies AS builder
COPY . .
RUN npm run db:generate && npm run build
# Merge before the final COPY so shared dependencies are not stored in two image layers.
COPY --from=migration-dependencies /app/node_modules ./.next/standalone/node_modules

FROM base AS runner
# Keep the optimized Next.js runtime; use development cookies for local HTTP.
ENV NODE_ENV=production \
    AUTH_COOKIE_SECURE=false \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node prisma.config.ts ./
COPY --chown=node:node prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=node:node prisma/migrations ./prisma/migrations
USER node
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node server.js"]

# Production image for the Flowtop API. Built and run by Render (see infra/render.yaml)
# and rebuilt in CI on every PR, so a broken image is caught before deploy.
#
#   docker build -t flowtop-api backend
#
# Configuration comes only from environment variables set in the host's secret
# storage. No .env file is ever copied in (see .dockerignore).

# ─── Build: full dependencies, compile, then drop dev dependencies ─────────
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# npm ci runs `prisma generate` (postinstall), which needs only the schema.
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ─── Runtime: compiled code, production dependencies, non-root ─────────────
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/prisma.config.ts ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 4000

# Apply pending migrations, then start. `migrate deploy` only applies committed
# migrations, never generates or resets, and holds a lock so two instances
# starting together cannot both run them.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main"]

# ─────────────────────────────────────────────────────────────────────────────
# DSHub Graduation Backend — Dockerfile
# Multi-stage build: builder stage installs deps, production stage runs app.
#
# Design decisions:
# - Multi-stage build keeps the final image lean — devDependencies (nodemon)
#   are installed in the builder stage and never copied to production.
# - node:18-alpine is used over node:18 — Alpine is ~120MB vs ~900MB.
# - Non-root user (node) runs the app — never run Node.js as root in production.
# - .dockerignore (see below) excludes node_modules, .env, uploads/, logs/
#   so they are never baked into the image.
# - uploads/ directory is created at runtime — not baked in — since Cloudinary
#   is used in production and local uploads are development-only.
# - Health check hits /health every 30s so Docker/Render knows the app is up.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first — Docker layer cache means npm install only
# re-runs when package.json or package-lock.json actually changes
COPY package*.json ./

# Install ALL dependencies including devDependencies
RUN npm ci

# Copy source code
COPY . .

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:18-alpine AS production

# Install dumb-init — a minimal process supervisor that correctly handles
# SIGTERM signals. Without it, Node.js runs as PID 1 which doesn't forward
# signals properly, breaking graceful shutdown on Render redeploys.
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only — excludes nodemon
RUN npm ci --omit=dev && npm cache clean --force

RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Copy built source from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/server.js ./server.js

# Create uploads directory for development fallback
# In production, files go to Cloudinary — this dir is unused but
# prevents errors if NODE_ENV is accidentally set incorrectly
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root user — never run Node.js as root
USER node

# Expose the application port
EXPOSE 9000

# Health check — Docker will mark the container unhealthy if /health
# stops responding, triggering a restart
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Start with dumb-init to correctly handle signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
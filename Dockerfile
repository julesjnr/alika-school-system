# =============================================================================
# Alika Medical Training College & Medical Center — Multi-stage Production Dockerfile
# =============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install native dependencies required for build tools
RUN apk add --no-cache python3 make g++

# Copy package descriptors for workspace caching
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm ci

# Copy application sources
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend and backend distribution bundles
RUN npm run build:frontend && npm run build:backend

# -----------------------------------------------------------------------------
# Stage 2: Production runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities
RUN apk add --no-cache curl

# Copy package manifests
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=backend && npm cache clean --force

# Copy built backend bundle and database migration files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/drizzle ./backend/drizzle

# Copy built static frontend bundle
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/dist ./dist

# Prepare storage directories with appropriate permissions
RUN mkdir -p /app/uploads/applications /app/uploads/schools /app/uploads/misc \
    && chown -R node:node /app

USER node

EXPOSE 3000

# Container health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

# Start the unified production server
CMD ["node", "backend/dist/server.cjs"]

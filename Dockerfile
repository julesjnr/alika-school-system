# ==========================================
# Alika School Portal - Production Dockerfile
# ==========================================

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

# Install all workspace dependencies
RUN npm ci

# Copy application source
COPY frontend ./frontend
COPY backend ./backend

# Build frontend and backend
RUN npm run build


# ==========================================
# Production image
# ==========================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# curl is required by the Docker healthcheck
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/dist ./dist

# Application uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "backend/dist/server.cjs"]

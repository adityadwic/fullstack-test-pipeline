# Multi-stage Dockerfile for Test Orchestration System
# Stage 1: Base Node image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Stage 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Build
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Create data directory
RUN mkdir -p /app/data /app/reports

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/src/app/server.js"]

# Stage 5: Test Runner
FROM base AS test-runner
WORKDIR /app

# Install all dependencies including dev
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Create reports directory
RUN mkdir -p /app/reports/api /app/reports/e2e /app/reports/performance

# Volume for reports
VOLUME ["/app/reports"]

# Default command runs all tests
CMD ["npm", "run", "test:all"]

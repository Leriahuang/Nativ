# ---------- Stage 1: Build the app ----------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies (use Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------- Stage 2: Serve static files ----------
FROM node:20-alpine

# Create an unprivileged user (Cloud Run friendly)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy build output only
COPY --from=build /app/dist ./dist

# Install a lightweight static file server
RUN npm install -g serve

# Cloud Run injects $PORT; default to 8080 for local dev
ENV PORT=8080

# Expose for local testing (Cloud Run ignores EXPOSE but it's good metadata)
EXPOSE 8080

# Use non‑root user
USER appuser

# Start the server
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]

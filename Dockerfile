# Stage 1: build the app
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: run the built app
FROM node:20-alpine

WORKDIR /app

# Copy build output
COPY --from=build /app/dist ./dist

# Install a lightweight static file server
RUN npm install -g serve

# Cloud Run injects $PORT; default to 8080 if not set
ENV PORT=8080

# Expose the port for local runs (Cloud Run uses $PORT env)
EXPOSE 8080

# Serve the static build
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]

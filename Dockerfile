# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2: Production Express server ─────────────────────────────────────
FROM node:20-alpine

WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/ .
# Copy built React app into Express's public folder
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "server.js"]

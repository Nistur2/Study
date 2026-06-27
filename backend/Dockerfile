# Stage 1 — Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY ../frontend/package.json ./
RUN npm install
COPY ../frontend/ .
RUN npm run build

# Stage 2 — Express backend
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js .
COPY --from=frontend-builder /app/frontend/dist ./public
EXPOSE 4000
CMD ["node", "server.js"]

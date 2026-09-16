# Multi-stage Dockerfile for POS Order & Inventory System
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server/ ./server/
COPY --from=frontend-builder /app/client/dist ./client/dist

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/src/server.js"]

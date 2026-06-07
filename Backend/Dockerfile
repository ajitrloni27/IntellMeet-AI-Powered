# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]

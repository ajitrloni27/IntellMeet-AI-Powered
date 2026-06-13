# Backend Dockerfile for Render
FROM node:20-alpine

WORKDIR /app

COPY Backend/package*.json ./

RUN npm ci

COPY Backend/ .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]

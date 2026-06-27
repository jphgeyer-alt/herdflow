# Stage 1: build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts ./
COPY client ./client
COPY server ./server
RUN npm ci
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json --from=builder /app/package-lock.json --from=builder /app/tsconfig.json ./
RUN npm ci
EXPOSE 4174
ENV PORT=4174
ENV STATIC_DIR=client/dist
CMD ["npm", "run", "start"]

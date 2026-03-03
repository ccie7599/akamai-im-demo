# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app

ARG VITE_AKAMAI_HOST
ARG VITE_ORIGIN_HOST
ARG VITE_AUTH_TOKEN

ENV VITE_AKAMAI_HOST=${VITE_AKAMAI_HOST}
ENV VITE_ORIGIN_HOST=${VITE_ORIGIN_HOST}
ENV VITE_AUTH_TOKEN=${VITE_AUTH_TOKEN}

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# Stage 2: Build server
FROM node:20-slim AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src/ src/
RUN npm run build

# Stage 3: Production
FROM node:20-slim AS production
WORKDIR /app

# Server production deps only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Compiled server
COPY --from=server-build /app/server/dist ./server/dist

# Frontend build output
COPY --from=frontend-build /app/dist ./dist

# EdgeWorker source (displayed in Edge Logic section)
COPY edgeworker/ ./edgeworker/

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/server
CMD ["node", "dist/index.js"]

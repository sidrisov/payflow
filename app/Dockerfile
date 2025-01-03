# Build dependencies
FROM node:22-alpine AS deps
WORKDIR /root

# Add python for node-gyp
RUN apk add --no-cache python3 make g++ gcc

# Copy package files
COPY package.json package-lock.json ./
COPY packages/common/package.json ./packages/common/
COPY app/package.json ./app/

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Build stage
FROM node:22-alpine AS builder
WORKDIR /root

ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /root/node_modules ./node_modules

# Copy package files directly from source
COPY package*.json ./
COPY packages/common/package.json ./packages/common/
COPY app/package.json ./app/

# Copy source
COPY packages/common ./packages/common
COPY app ./app

RUN npm run build:ssr --workspace=app

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /root

# Add python for node-gyp in production
RUN apk add --no-cache python3 make g++ gcc

# Install production dependencies with cache
COPY package.json package-lock.json ./
COPY packages/common/package.json ./packages/common/
COPY app/package.json ./app/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

COPY --from=builder /root/app/server.js ./app/server.js
COPY --from=builder /root/app/dist/client ./app/dist/client
COPY --from=builder /root/packages/common/dist ./packages/common/dist

WORKDIR /root/app

EXPOSE 8080
CMD ["npm", "run", "serve"]

# Build dependencies
FROM node:22-alpine AS deps
WORKDIR /root

# Copy package files
COPY package.json package-lock.json ./
COPY packages/common/package.json ./packages/common/
COPY services/onchain/package.json ./services/onchain/

# Install dependencies
RUN npm ci

# Build stage
FROM node:22-alpine AS builder
WORKDIR /root

COPY --from=deps /root/node_modules ./node_modules

# Copy package files directly from source
COPY package*.json ./
COPY packages/common/package.json ./packages/common/
COPY services/onchain/package.json ./services/onchain/

# Copy source
COPY packages/common ./packages/common
COPY services/onchain ./services/onchain

RUN npm run build --workspace=packages/common && \
    npm run build --workspace=services/onchain

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /root

COPY --from=builder /root/node_modules ./node_modules

COPY --from=builder /root/services/onchain ./services/onchain
COPY --from=builder /root/packages/common/dist ./packages/common/dist
COPY --from=builder /root/packages/common/package*.json ./packages/common/

WORKDIR /root/services/onchain
EXPOSE 3000
CMD ["npm", "run", "prod"]

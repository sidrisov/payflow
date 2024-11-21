# Build dependencies
FROM node:21-alpine AS deps
WORKDIR /root

# Copy package files
COPY package*.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/frames/package*.json ./services/frames/

# Install dependencies
RUN npm ci

# Build stage
FROM node:21-alpine AS builder
WORKDIR /root

COPY --from=deps /root/node_modules ./node_modules

# Copy package files directly from source
COPY package*.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/frames/package*.json ./services/frames/

# Copy source
COPY packages/common ./packages/common
COPY services/frames ./services/frames

RUN npm run build --workspace=packages/common && \
    npm run build --workspace=services/frames

# Runner stage
FROM node:21-alpine AS runner
WORKDIR /root

COPY --from=builder /root/node_modules ./node_modules

COPY --from=builder /root/services/frames ./services/frames
COPY --from=builder /root/packages/common/dist ./packages/common/dist
COPY --from=builder /root/packages/common/package*.json ./packages/common/

WORKDIR /root/services/frames
EXPOSE 3000
CMD ["npm", "run", "start"]

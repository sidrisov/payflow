# Build dependencies
FROM node:21-alpine AS deps
WORKDIR /root

# Copy package files
COPY package*.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/frames/package*.json ./services/frames/

# Install dependencies
RUN npm install

# Build stage
FROM node:21-alpine AS builder
WORKDIR /root

# Copy deps
COPY --from=deps /root/node_modules ./node_modules
COPY --from=deps /root/packages ./packages
COPY --from=deps /root/services ./services

# Copy source
COPY packages/common ./packages/common
COPY services/frames ./services/frames

# Build
RUN cd packages/common && npm run build
RUN cd services/frames && npm run build

# Runner stage
FROM node:21-alpine AS runner
WORKDIR /root

COPY --from=builder /root/services/frames /root/services/frames
COPY --from=builder /root/node_modules /root/node_modules
COPY --from=builder /root/packages/common/dist /root/packages/common/dist
COPY --from=builder /root/packages/common/package*.json /root/packages/common/

WORKDIR /root/services/frames
EXPOSE 3000
CMD ["npm", "run", "start"]

# Build dependencies
FROM node:21-alpine as dependencies
WORKDIR /frames
COPY package*.json ./
RUN npm ci --only=production

# Build application
FROM dependencies AS builder
COPY . .
RUN npm run build

# Production image
FROM builder AS runner
COPY . .

EXPOSE 3000
CMD npm run start

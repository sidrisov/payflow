# Build dependencies
FROM node:21-alpine as dependencies
WORKDIR /frames
COPY package*.json ./
RUN npm i
COPY . . 
# Build production image
FROM dependencies as builder
RUN npm run build
EXPOSE 3000
CMD npm run start

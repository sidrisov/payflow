#!/bin/sh
docker run -d --restart always \
     --network payflow-network --network-alias mysql \
     --name payflow-redis \
     -p 6379:6379 \
     redis:latest \
     --save 60 1 --loglevel warning

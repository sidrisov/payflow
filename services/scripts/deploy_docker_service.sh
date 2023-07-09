#!/bin/sh

docker stop payflow-service && docker rm -f payflow-service
docker run -d \
     --network payflow-network --network-alias signing-service \
     --name payflow-service \
     -p 8081:8080 \
     docker.io/library/payflow-service:0.0.1-SNAPSHOT

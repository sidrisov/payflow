#!/bin/sh
docker run -d \
     --network payflow-network --network-alias mysql \
     --name payflow-mysql \
     -p 3306:3306 \
     -e MYSQL_ROOT_PASSWORD=password \
     -e MYSQL_DATABASE=payflow_db \
     mysql:latest

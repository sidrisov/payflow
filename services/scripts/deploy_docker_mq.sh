#!/bin/sh
docker run -d \
     --network payflow-network --network-alias mq --hostname mq \
     --name payflow-mq \
     -p 5672:5672 \
     -p 15672:15672 \
     -e RABBITMQ_DEFAULT_USER=root \
     -e RABBITMQ_DEFAULT_PASS=password \
     rabbitmq:3-management

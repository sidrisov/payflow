cd ./../payflow-service

# building container image for cloud run 
# via gradle with Paketo Buildpack
PROJECT_ID=$(gcloud config get-value project)
VERSION=$(gradle properties -q | awk '/^version:/ {print $2}')
PROFILE=gcp

GCP_SQL_INSTANCE_NAME=${PROJECT_ID}:europe-west4:${PROJECT_ID}-mysql-eu
SQL_DB_NAME=payflow_db
DAPP_URL=https://app.stg.payflow.me
COOKIE_DOMAIN=payflow.me

gradle -s bootBuildImage -P${PROFILE} \
 -Pgcp-image-name=europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service

docker push europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service:${VERSION}


gcloud run deploy api-payflow-service-staging \
  --allow-unauthenticated \
  --image=europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service:${VERSION} \
--min-instances=0 --max-instances=2 \
--memory=1024Mi \
--set-env-vars="SPRING_PROFILES_ACTIVE=${PROFILE},PROJECT_ID=${PROJECT_ID},GCP_SQL_INSTANCE_NAME=${GCP_SQL_INSTANCE_NAME},SQL_DB_NAME=${SQL_DB_NAME},DAPP_URL=${DAPP_URL},COOKIE_DOMAIN=${COOKIE_DOMAIN}"

# check service details
gcloud run services describe api-payflow-service-staging

# run service locally with GCP CloudSQL
# CloudSQL credentials are picked up automatically via DefaultCredentialsProvider
#gradlew bootRun -Pgcp

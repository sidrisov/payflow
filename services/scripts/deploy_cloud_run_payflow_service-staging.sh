cd ./../payflow-service

# building container image for cloud run 
# via gradle with Paketo Buildpack
PROJECT_ID=$(gcloud config get-value project)
VERSION=$(gradle properties -q | awk '/^version:/ {print $2}')

gradle -s bootBuildImage -Pgcp-staging \
 -Pgcp-image-name=europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service

docker push europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service:${VERSION}


gcloud run deploy api-payflow-service-staging \
  --allow-unauthenticated \
  --image=europe-docker.pkg.dev/${PROJECT_ID}/services/api-payflow-service:${VERSION} \
--min-instances=1 --max-instances=2 \
--memory=1024Mi \
--set-env-vars="SPRING_PROFILES_ACTIVE=gcp-staging"

# check service details
gcloud run services describe api-payflow-service-staging

# run service locally with GCP CloudSQL
# CloudSQL credentials are picked up automatically via DefaultCredentialsProvider
#gradlew bootRun -Pgcp-staging

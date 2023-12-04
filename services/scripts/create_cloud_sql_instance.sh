PROJECT_ID=$(gcloud config get-value project)
gcloud sql instances create ${PROJECT_ID}-mysql-eu \
  --database-version=MYSQL_8_0_35 \
  --region=europe-west4 \
  --cpu=2 \
  --memory=4G \
  --enable-bin-log \
  --backup \

gcloud sql databases create payflow_db --instance=${PROJECT_ID}-mysql-eu

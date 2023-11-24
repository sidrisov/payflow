gcloud sql instances create payflow-staging-mysql-eu \
  --database-version=MYSQL_8_0_35 \
  --region=europe-west4 \
  --cpu=2 \
  --memory=4G

gcloud sql databases create payflow_db --instance=payflow-staging-mysql-eu

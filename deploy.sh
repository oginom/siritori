set -eux

PROJECT_ID=""
REGION="asia-northeast1"
FUNCTION_NAME="siritori"

# Deploy
gcloud run deploy $FUNCTION_NAME \
    --source . \
    --platform managed \
    --project $PROJECT_ID \
    --region $REGION \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --set-env-vars "OPENAI_API_KEY=$OPENAI_API_KEY"

#!/bin/bash

# Build and push Docker images to Google Artifact Registry
# Usage: ./scripts/build-and-push.sh <project-id> <region>

set -e

PROJECT_ID=${1:-"gcp-project-id"}
REGION=${2:-"gcp-region"}
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-repo"

# Static service URLs for frontend build args
DOMAIN="cs3219-ay2526s1-g13.com"
USER_SERVICE_URL="https://${DOMAIN}/api/user"
MATCHING_SERVICE_URL="https://${DOMAIN}/api/matching"
QUESTION_SERVICE_URL="https://${DOMAIN}/api/question"
COLLABORATION_SERVICE_URL="https://${DOMAIN}/api/collaboration"
VIDEO_CALL_SERVICE_URL="https://${DOMAIN}/api/video-call"


echo "🔨 Building and pushing Docker images to ${REGISTRY}"

# Authenticate with Google Cloud
echo "🔐 Authenticating with Google Cloud..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Services to build (service-name:context-path:dockerfile-name)
SERVICES=(
  "user-service:backend/user-service:Dockerfile.user"
  "matching-service:backend/matching-service:Dockerfile.matching"
  "question-service:backend/question-service:Dockerfile.question"
  "collaboration-service:backend/collaboration-service:Dockerfile.collaboration"
  "execution-service:backend/execution-service:Dockerfile.execution"
  "video-call-service:backend/video-call-service:Dockerfile.video"
  "frontend:frontend:Dockerfile.frontend"
)

for SERVICE_CONFIG in "${SERVICES[@]}"; do
  IFS=':' read -r SERVICE_NAME SERVICE_PATH DOCKERFILE <<< "$SERVICE_CONFIG"
  
  echo ""
  echo "📦 Building ${SERVICE_NAME}..."
  
  # Check if Dockerfile exists
  if [ ! -f "${SERVICE_PATH}/${DOCKERFILE}" ]; then
    echo "❌ Error: ${DOCKERFILE} not found at ${SERVICE_PATH}/${DOCKERFILE}"
    echo "   Please ensure the Dockerfile exists before building."
    exit 1
  fi
  
  # Need to build for linux/amd64 for GCP compatibility
  echo "   Using ${DOCKERFILE}"

  # Use an if-statement to provide build ARGs ONLY for the frontend
  if [ "$SERVICE_NAME" == "frontend" ]; then
    echo "   Injecting  build arguments for frontend..."
    docker buildx build --platform linux/amd64 \
      --build-arg USER_SERVICE_URL="$USER_SERVICE_URL" \
      --build-arg MATCHING_SERVICE_URL="$MATCHING_SERVICE_URL" \
      --build-arg QUESTION_SERVICE_URL="$QUESTION_SERVICE_URL" \
      --build-arg COLLABORATION_SERVICE_URL="$COLLABORATION_SERVICE_URL" \
      --build-arg VIDEO_CALL_SERVICE_URL="$VIDEO_CALL_SERVICE_URL" \
      -f "${SERVICE_PATH}/${DOCKERFILE}" -t "${REGISTRY}/${SERVICE_NAME}:latest" --load "${SERVICE_PATH}"
  else
    docker buildx build --platform linux/amd64 \
      -f "${SERVICE_PATH}/${DOCKERFILE}" -t "${REGISTRY}/${SERVICE_NAME}:latest" --load "${SERVICE_PATH}"
  fi
  
  # Push image
  echo "⬆️  Pushing ${SERVICE_NAME}..."
  docker push "${REGISTRY}/${SERVICE_NAME}:latest"
  
  echo "✅ ${SERVICE_NAME} pushed successfully"
done

echo ""
echo "🎉 All images built and pushed successfully!"
echo "   Registry: ${REGISTRY}"
echo ""
echo "Images pushed:"
for SERVICE_CONFIG in "${SERVICES[@]}"; do
  IFS=':' read -r SERVICE_NAME SERVICE_PATH DOCKERFILE <<< "$SERVICE_CONFIG"
  echo "  - ${REGISTRY}/${SERVICE_NAME}:latest"
done

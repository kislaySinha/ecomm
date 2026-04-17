#!/usr/bin/env bash
# deploy.sh — Full deployment of AmCart microservices to AWS
# Run from the repo root: ./deploy.sh
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────
for cmd in aws terraform docker node npm; do
  command -v "$cmd" &>/dev/null || error "Required tool not found: $cmd"
done

info "Checking AWS credentials..."
aws sts get-caller-identity --query 'Account' --output text &>/dev/null || \
  error "AWS credentials not configured. Run: aws configure"

ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
info "Deploying to AWS account: $ACCOUNT_ID"

# ── Step 1: Terraform — create ECR repos first ────────────────────
info "=== STEP 1: Initialising Terraform ==="
cd terraform
terraform init

info "Creating ECR repositories..."
terraform apply \
  -target=aws_ecr_repository.services \
  -target=aws_ecr_lifecycle_policy.services \
  -auto-approve

# ── Step 2: Build and push Docker images ─────────────────────────
info "=== STEP 2: Building and pushing Docker images ==="
cd ..

REGION=$(aws configure get region 2>/dev/null || terraform -chdir=terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

info "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build and push each service
declare -A SERVICE_CONTEXTS=(
  ["auth-service"]="./services/auth-service"
  ["product-service"]="./services/product-service"
  ["search-service"]="./services/search-service"
  ["legacy-app"]="."
)

for SERVICE in "${!SERVICE_CONTEXTS[@]}"; do
  CONTEXT="${SERVICE_CONTEXTS[$SERVICE]}"
  REPO="$ECR_REGISTRY/amcart/$SERVICE"

  info "Building $SERVICE from $CONTEXT..."
  docker build -t "$REPO:latest" "$CONTEXT"

  info "Pushing $SERVICE..."
  docker push "$REPO:latest"
done

info "All images pushed to ECR."

# ── Step 3: Full Terraform apply ──────────────────────────────────
info "=== STEP 3: Deploying full infrastructure ==="
cd terraform
terraform apply -auto-approve

# Capture outputs
ALB_URL=$(terraform output -raw alb_dns)
CF_DOMAIN=$(terraform output -raw cloudfront_url)
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)

info "ALB URL: $ALB_URL"
info "CloudFront: $CF_DOMAIN"

# ── Step 4: Build and deploy React frontend ───────────────────────
info "=== STEP 4: Building React frontend ==="
cd ../frontend

info "Installing dependencies..."
npm ci

info "Building with API URL: $ALB_URL"
VITE_API_URL="$ALB_URL" npm run build

info "Uploading to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete --region "$REGION"

info "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --region us-east-1 \
  --query 'Invalidation.Id' --output text

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Frontend:   ${GREEN}$CF_DOMAIN${NC}"
echo -e "  API (ALB):  ${GREEN}$ALB_URL${NC}"
echo ""
echo "  ECS services take ~2 min to become healthy."
echo "  Monitor with:"
echo "    aws ecs describe-services --cluster amcart-cluster \\"
echo "      --services amcart-auth amcart-product amcart-search amcart-legacy"
echo ""
echo "  Seed admin user:"
echo "    curl -X POST $ALB_URL/auth/admin/seed"

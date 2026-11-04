#!/usr/bin/env bash
# Build and run the portal container on an EC2 host. Infrastructure (ALB,
# networking, RDS, IAM, and the protected environment file) is provisioned separately.
set -Eeuo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/etc/unified-school-portal.env"
IMAGE="unified-school-portal:latest"
CONTAINER="unified-school-portal"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Create it with DATABASE_URL, JWT_SECRET, and AWS_S3_BUCKET." >&2
  exit 1
fi
if [[ "$(stat -c '%a' "$ENV_FILE")" != "600" ]]; then
  echo "$ENV_FILE must have mode 600 (chmod 600 $ENV_FILE)." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y docker
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y docker.io
  else
    echo "Install Docker on this host before deploying." >&2
    exit 1
  fi
fi
sudo systemctl enable --now docker

cd "$APP_DIR"
sudo docker build --pull -t "$IMAGE" .

# The image is built before stopping the current container so a failed build
# leaves the running version untouched.
sudo docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
sudo docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  "$IMAGE"

echo "Container started. Check with: sudo docker logs -f $CONTAINER"

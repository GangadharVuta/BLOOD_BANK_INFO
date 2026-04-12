#!/bin/bash
# Blood Bank Deployment Script
# Automates the deployment process
# Usage: ./deploy.sh [production|staging|development]

set -e

# Configuration
DEPLOY_ENV=${1:-production}
PROJECT_DIR="/var/www/bloodbank-api"
REPO_URL="git@github.com:your-org/blood-bank-api.git"
BRANCH="main"
LOG_FILE="/var/log/bloodbank-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error_message() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    exit 1
}

warning_message() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

# Validate environment
if [[ ! "$DEPLOY_ENV" =~ ^(production|staging|development)$ ]]; then
    error_message "Invalid environment: $DEPLOY_ENV. Use: production, staging, or development"
fi

log_message "=========================================="
log_message "Starting deployment to $DEPLOY_ENV"
log_message "=========================================="

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log_message "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Initialize or update git repository
if [ ! -d ".git" ]; then
    log_message "Cloning repository..."
    git clone "$REPO_URL" .
else
    log_message "Updating repository..."
    git fetch origin
fi

# Checkout branch
log_message "Checking out $BRANCH branch..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

COMMIT_HASH=$(git rev-parse --short HEAD)
log_message "Deployed commit: $COMMIT_HASH"

# Backup current deployment
if [ -d "blood-bank-node/node_modules" ]; then
    log_message "Creating deployment backup..."
    BACKUP_DIR="backups/deploy_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r blood-bank-node/node_modules "$BACKUP_DIR/"
fi

# Install dependencies
log_message "Installing dependencies..."
cd blood-bank-node
npm ci --only=production || error_message "npm install failed"

# Run database migrations if needed
if [ -f "migrations/run.js" ]; then
    log_message "Running database migrations..."
    node migrations/run.js || warning_message "Database migrations failed (non-critical)"
fi

cd ..

# Build React frontend if not using separate deployment
if [ -d "blood-bank-react" ]; then
    log_message "Building React frontend..."
    cd blood-bank-react
    npm ci || error_message "npm install failed for React"
    npm run build || error_message "React build failed"
    cd ..
fi

# Restart application
log_message "Restarting application..."

if command -v systemctl &> /dev/null; then
    systemctl restart bloodbank-api
    log_message "✅ Application restarted with systemctl"
elif command -v pm2 &> /dev/null; then
    pm2 restart bloodbank-api
    log_message "✅ Application restarted with PM2"
else
    warning_message "Could not restart service - manual restart may be required"
fi

# Wait for service to be ready
log_message "Waiting for service to be ready..."
for i in {1..30}; do
    if curl -s "http://localhost:4000/api/health" > /dev/null; then
        log_message "✅ Service is ready"
        break
    fi
    
    if [ $i -eq 30 ]; then
        error_message "Service failed to start after 30 seconds"
    fi
    
    sleep 1
done

# Run health checks
log_message "Running health checks..."
HEALTH_STATUS=$(curl -s "http://localhost:4000/api/health" | jq -r '.status // "unknown"')

if [ "$HEALTH_STATUS" = "healthy" ]; then
    log_message "✅ Health check passed"
else
    warning_message "Health check returned: $HEALTH_STATUS"
fi

# Clear application cache if needed
log_message "Clearing cache..."
rm -rf /tmp/bloodbank-cache 2>/dev/null || true

# Send deployment notification
log_message "Sending deployment notification..."
NOTIFICATION_PAYLOAD="{
  \"text\": \"✅ Blood Bank API deployed successfully\",
  \"attachments\": [{
    \"color\": \"good\",
    \"fields\": [
      {\"title\": \"Environment\", \"value\": \"$DEPLOY_ENV\", \"short\": true},
      {\"title\": \"Commit\", \"value\": \"$COMMIT_HASH\", \"short\": true},
      {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": false}
    ]
  }]
}"

# Uncomment to enable Slack notifications
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
#   -H 'Content-type: application/json' \
#   -d "$NOTIFICATION_PAYLOAD"

log_message "=========================================="
log_message "✅ Deployment completed successfully!"
log_message "=========================================="

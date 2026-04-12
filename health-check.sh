#!/bin/bash
# Blood Bank Health Check Script
# Monitors API health and restarts if needed
# Usage: ./health-check.sh
# Add to crontab: */5 * * * * /var/www/bloodbank-api/scripts/health-check.sh

set -e

API_URL="http://localhost:4000/api/health"
TIMEOUT=5
RETRIES=3
LOG_FILE="/var/log/bloodbank-health-check.log"
MAX_FAILURES=5

# Get current failure count
FAILURE_FILE="/tmp/bloodbank-health-failures"
if [ ! -f "$FAILURE_FILE" ]; then
    echo "0" > "$FAILURE_FILE"
fi
FAILURES=$(cat "$FAILURE_FILE")

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check API health
check_health() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT --max-time $TIMEOUT "$API_URL")
    
    if [ "$status" = "200" ]; then
        return 0
    else
        return 1
    fi
}

log_message "Health check started..."

# Try multiple times with retries
for attempt in $(seq 1 $RETRIES); do
    if check_health; then
        # Success - reset failure counter
        echo "0" > "$FAILURE_FILE"
        log_message "✅ Health check passed (attempt $attempt/$RETRIES)"
        exit 0
    else
        log_message "⚠️ Health check failed (attempt $attempt/$RETRIES)"
    fi
    
    # Wait before retry
    if [ $attempt -lt $RETRIES ]; then
        sleep 2
    fi
done

# All retries failed
FAILURES=$((FAILURES + 1))
echo "$FAILURES" > "$FAILURE_FILE"

log_message "❌ Health check failed after $RETRIES attempts (total failures: $FAILURES)"

# Restart service if failures exceed threshold
if [ $FAILURES -ge $MAX_FAILURES ]; then
    log_message "🔄 Restarting Blood Bank API service..."
    
    if command -v systemctl &> /dev/null; then
        systemctl restart bloodbank-api
        log_message "✅ Service restarted with systemctl"
    elif command -v pm2 &> /dev/null; then
        pm2 restart bloodbank-api
        log_message "✅ Service restarted with PM2"
    else
        log_message "❌ Could not restart service - no init system found"
    fi
    
    # Reset counter
    echo "0" > "$FAILURE_FILE"
    
    # Send alert (optional)
    # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    #   -d "{\"text\": \"⚠️ Blood Bank API was restarted due to health check failures\"}"
else
    exit 1
fi

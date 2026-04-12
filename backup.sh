#!/bin/bash
# Blood Bank Database Backup Script
# Automated daily MongoDB backup with compression and retention
# Usage: ./backup.sh
# Add to crontab: 0 2 * * * /var/www/bloodbank-api/scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/bloodbank"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGODB_USER="${MONGODB_USER}"
MONGODB_PASSWORD="${MONGODB_PASSWORD}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/bloodbank_backup_$TIMESTAMP"
LOG_FILE="/var/log/bloodbank-backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

# Start backup
log_message "=========================================="
log_message "Starting MongoDB backup"
log_message "Backup directory: $BACKUP_DIR"

# Perform backup
if [ -z "$MONGODB_USER" ]; then
    # Backup without authentication
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_FILE" 2>&1 >> "$LOG_FILE"
else
    # Backup with authentication
    mongodump \
        --uri="mongodb://$MONGODB_USER:$MONGODB_PASSWORD@${MONGODB_URI#mongodb://}" \
        --out="$BACKUP_FILE" 2>&1 >> "$LOG_FILE"
fi

if [ $? -eq 0 ]; then
    log_message "✅ Backup completed successfully"
    
    # Compress backup
    log_message "Compressing backup..."
    tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "bloodbank_backup_$TIMESTAMP" 2>&1 >> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "✅ Compression completed"
        rm -rf "$BACKUP_FILE"
        
        # Get backup file size
        SIZE=$(du -h "$BACKUP_FILE.tar.gz" | cut -f1)
        log_message "Backup size: $SIZE"
        
        # Cleanup old backups (older than RETENTION_DAYS)
        log_message "Cleaning up old backups (older than $RETENTION_DAYS days)..."
        find "$BACKUP_DIR" -name "bloodbank_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
        
        # Count remaining backups
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "bloodbank_backup_*.tar.gz" | wc -l)
        log_message "Kept $BACKUP_COUNT backup(s)"
        
        # Optional: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
        # Example for AWS S3:
        # aws s3 cp "$BACKUP_FILE.tar.gz" s3://your-bucket/bloodbank-backups/
        
        log_message "✅ Backup process completed successfully"
        
        # Send notification (optional)
        # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
        #   -d "{\"text\": \"✅ Backup completed: $SIZE\"}"
        
    else
        log_message "❌ Compression failed"
        exit 1
    fi
else
    log_message "❌ Backup failed"
    exit 1
fi

log_message "=========================================="

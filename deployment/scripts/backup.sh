#!/bin/bash
# ============================================
# Backup Script for KasmChannelGPT
# Backs up database and Qdrant data
# ============================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="kasmchannelgpt_backup_${TIMESTAMP}"

echo "============================================"
echo "KasmChannelGPT Backup"
echo "============================================"
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

echo "📦 Creating backup: $BACKUP_NAME"
echo ""

# Backup application data
echo "💾 Backing up application data..."
docker run --rm \
    -v kasmchannelgpt-app-data:/data \
    -v $(pwd)/$BACKUP_DIR:/backup \
    alpine tar czf /backup/${BACKUP_NAME}_app-data.tar.gz -C /data .

# Backup Qdrant data
echo "💾 Backing up Qdrant vector database..."
docker run --rm \
    -v kasmchannelgpt-qdrant-storage:/data \
    -v $(pwd)/$BACKUP_DIR:/backup \
    alpine tar czf /backup/${BACKUP_NAME}_qdrant-storage.tar.gz -C /data .

# Backup logs
echo "📝 Backing up application logs..."
docker run --rm \
    -v kasmchannelgpt-app-logs:/data \
    -v $(pwd)/$BACKUP_DIR:/backup \
    alpine tar czf /backup/${BACKUP_NAME}_logs.tar.gz -C /data .

# Create backup manifest
echo "📋 Creating backup manifest..."
cat > $BACKUP_DIR/${BACKUP_NAME}_manifest.txt << EOF
Backup: $BACKUP_NAME
Date: $(date)
Hostname: $(hostname)

Files:
- ${BACKUP_NAME}_app-data.tar.gz
- ${BACKUP_NAME}_qdrant-storage.tar.gz
- ${BACKUP_NAME}_logs.tar.gz

To restore this backup:
./deployment/scripts/restore.sh $BACKUP_NAME
EOF

# Calculate sizes
APP_SIZE=$(du -h $BACKUP_DIR/${BACKUP_NAME}_app-data.tar.gz | cut -f1)
QDRANT_SIZE=$(du -h $BACKUP_DIR/${BACKUP_NAME}_qdrant-storage.tar.gz | cut -f1)
LOGS_SIZE=$(du -h $BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz | cut -f1)

echo ""
echo "============================================"
echo "Backup Complete! 🎉"
echo "============================================"
echo ""
echo "Backup files:"
echo "  App Data:     ${BACKUP_NAME}_app-data.tar.gz ($APP_SIZE)"
echo "  Qdrant Data:  ${BACKUP_NAME}_qdrant-storage.tar.gz ($QDRANT_SIZE)"
echo "  Logs:         ${BACKUP_NAME}_logs.tar.gz ($LOGS_SIZE)"
echo "  Manifest:     ${BACKUP_NAME}_manifest.txt"
echo ""
echo "Location: $BACKUP_DIR/"
echo ""
echo "To restore: ./deployment/scripts/restore.sh $BACKUP_NAME"
echo "============================================"

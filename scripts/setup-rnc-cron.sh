#!/bin/bash

# Setup script for DGII RNC daily synchronization
# Run this script once to set up the daily cron job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/rnc-daily-sync.sh"

echo "🔧 Setting up DGII RNC Daily Sync..."

# Check if the sync script exists
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Error: Sync script not found at $SYNC_SCRIPT"
    exit 1
fi

# Make sure the script is executable
chmod +x "$SYNC_SCRIPT"

# Create log directory if it doesn't exist
sudo mkdir -p /var/log
sudo touch /var/log/pos-rnc-sync.log
sudo chmod 666 /var/log/pos-rnc-sync.log

echo "📝 Creating cron job..."

# Create cron job entry (runs daily at 2:00 AM)
CRON_ENTRY="0 2 * * * $SYNC_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SYNC_SCRIPT"; then
    echo "ℹ️  Cron job already exists. Updating..."
    # Remove existing entry and add new one
    (crontab -l 2>/dev/null | grep -v "$SYNC_SCRIPT"; echo "$CRON_ENTRY") | crontab -
else
    echo "➕ Adding new cron job..."
    # Add new entry
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
fi

echo "✅ Cron job setup complete!"
echo ""
echo "📋 Summary:"
echo "   • Script location: $SYNC_SCRIPT"
echo "   • Log file: /var/log/pos-rnc-sync.log"
echo "   • Schedule: Daily at 2:00 AM"
echo ""
echo "🔍 To view current cron jobs: crontab -l"
echo "📊 To check sync logs: tail -f /var/log/pos-rnc-sync.log"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Update the ADMIN_TOKEN in $SYNC_SCRIPT"
echo "   2. Update the POS_SYSTEM_URL if needed"
echo "   3. Install jq if not already installed: sudo apt install jq"

#!/bin/bash

# DGII RNC Daily Sync Script
# This script should be run daily via cron job

# Configuration
POS_SYSTEM_URL="http://localhost:3000"
ADMIN_TOKEN="your_admin_token_here"  # Replace with actual admin token
LOG_FILE="/var/log/pos-rnc-sync.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to send notification (customize as needed)
send_notification() {
    local message="$1"
    local status="$2"
    
    # You can implement email, Slack, or other notifications here
    log_message "NOTIFICATION [$status]: $message"
    
    # Example: Send email (requires mail command)
    # echo "$message" | mail -s "POS RNC Sync $status" admin@yourcompany.com
}

# Main sync function
sync_rnc_data() {
    log_message "Starting DGII RNC synchronization..."
    
    # Make API call to sync endpoint
    response=$(curl -s -X POST "$POS_SYSTEM_URL/api/rnc/sync" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -w "HTTPSTATUS:%{http_code}")
    
    # Extract HTTP status code
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq 200 ]; then
        # Parse successful response
        total_records=$(echo "$response_body" | jq -r '.data.totalRecords // "unknown"')
        log_message "SUCCESS: Synchronized $total_records RNC records"
        send_notification "RNC sync completed successfully. $total_records records synchronized." "SUCCESS"
        return 0
    else
        # Handle error
        error_message=$(echo "$response_body" | jq -r '.error // "Unknown error"')
        log_message "ERROR: HTTP $http_code - $error_message"
        send_notification "RNC sync failed: $error_message (HTTP $http_code)" "ERROR"
        return 1
    fi
}

# Check if POS system is running
check_pos_system() {
    if curl -s -f "$POS_SYSTEM_URL/api/health" > /dev/null; then
        return 0
    else
        log_message "ERROR: POS system is not responding at $POS_SYSTEM_URL"
        send_notification "POS system is not responding. RNC sync skipped." "ERROR"
        return 1
    fi
}

# Main execution
main() {
    log_message "=== DGII RNC Sync Job Started ==="
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        log_message "ERROR: jq command not found. Please install jq for JSON parsing."
        exit 1
    fi
    
    # Check if POS system is running
    if ! check_pos_system; then
        exit 1
    fi
    
    # Perform sync
    if sync_rnc_data; then
        log_message "=== DGII RNC Sync Job Completed Successfully ==="
        exit 0
    else
        log_message "=== DGII RNC Sync Job Failed ==="
        exit 1
    fi
}

# Run main function
main "$@"

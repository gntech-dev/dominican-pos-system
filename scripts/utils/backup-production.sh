#!/bin/bash

# Production Backup Automation Script
# Creates automated database and file backups for production environment

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/pos"
LOG_DIR="/var/log/pos"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_DIR/backup.log"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_DIR/backup.log"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_DIR/backup.log"
}

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo privileges"
        exit 1
    fi
}

# Create backup directories
setup_directories() {
    log "Setting up backup directories..."
    
    mkdir -p "$BACKUP_DIR"/{database,files,config}
    mkdir -p "$LOG_DIR"
    
    # Set proper permissions
    chmod 750 "$BACKUP_DIR"
    chmod 640 "$LOG_DIR"
    
    log "Backup directories created successfully"
}

# Database backup function
backup_database() {
    log "Starting database backup..."
    
    # Read database configuration from environment
    if [[ ! -f ".env.production" ]]; then
        error "Production environment file not found"
        return 1
    fi
    
    source .env.production
    
    local db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
    local db_user=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
    
    if [[ -z "$db_name" || -z "$db_host" || -z "$db_user" ]]; then
        error "Could not parse database configuration"
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/database/pos_db_$TIMESTAMP.sql"
    
    # Create database dump
    if PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
        -h "$db_host" \
        -U "$db_user" \
        -d "$db_name" \
        --verbose \
        --clean \
        --create \
        --format=custom \
        --file="$backup_file.custom" 2>> "$LOG_DIR/backup.log"; then
        
        # Also create plain text version for easier restoration
        PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
            -h "$db_host" \
            -U "$db_user" \
            -d "$db_name" \
            --verbose \
            --clean \
            --create \
            --format=plain \
            --file="$backup_file" 2>> "$LOG_DIR/backup.log"
        
        # Compress backups
        gzip "$backup_file"
        gzip "$backup_file.custom"
        
        log "Database backup completed: ${backup_file}.gz"
    else
        error "Database backup failed"
        return 1
    fi
}

# Application files backup
backup_files() {
    log "Starting application files backup..."
    
    local backup_file="$BACKUP_DIR/files/pos_files_$TIMESTAMP.tar.gz"
    
    # Define files and directories to backup
    local backup_items=(
        ".env.production"
        "package.json"
        "package-lock.json"
        "next.config.ts"
        "tsconfig.json"
        "prisma/"
        "public/"
        "src/"
        "docs/"
        "scripts/"
    )
    
    # Create compressed archive
    if tar -czf "$backup_file" "${backup_items[@]}" 2>> "$LOG_DIR/backup.log"; then
        log "Application files backup completed: $backup_file"
    else
        error "Application files backup failed"
        return 1
    fi
}

# Configuration backup
backup_config() {
    log "Starting configuration backup..."
    
    local config_backup="$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz"
    
    # Backup system configuration files
    local config_items=(
        "/etc/nginx/sites-available/pos" 2>/dev/null || true
        "/etc/systemd/system/pos.service" 2>/dev/null || true
        "/etc/ssl/certs/pos.*" 2>/dev/null || true
        "/etc/letsencrypt/live/*/fullchain.pem" 2>/dev/null || true
        "/etc/letsencrypt/live/*/privkey.pem" 2>/dev/null || true
    )
    
    # Filter existing files
    local existing_configs=()
    for item in "${config_items[@]}"; do
        if [[ -f "$item" || -d "$item" ]]; then
            existing_configs+=("$item")
        fi
    done
    
    if [[ ${#existing_configs[@]} -gt 0 ]]; then
        if tar -czf "$config_backup" "${existing_configs[@]}" 2>> "$LOG_DIR/backup.log"; then
            log "Configuration backup completed: $config_backup"
        else
            warning "Configuration backup partially failed"
        fi
    else
        warning "No system configuration files found to backup"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Find and remove old backups
    find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_DIR/backup.log"
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_DIR/backup.log"
    find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_DIR/backup.log"
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backups() {
    log "Verifying backup integrity..."
    
    local error_count=0
    
    # Check database backup
    local latest_db_backup=$(find "$BACKUP_DIR/database" -name "pos_db_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -n "$latest_db_backup" ]]; then
        if gzip -t "$latest_db_backup" 2>/dev/null; then
            log "Database backup integrity verified: $latest_db_backup"
        else
            error "Database backup integrity check failed: $latest_db_backup"
            ((error_count++))
        fi
    fi
    
    # Check files backup
    local latest_files_backup=$(find "$BACKUP_DIR/files" -name "pos_files_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -n "$latest_files_backup" ]]; then
        if tar -tzf "$latest_files_backup" >/dev/null 2>&1; then
            log "Files backup integrity verified: $latest_files_backup"
        else
            error "Files backup integrity check failed: $latest_files_backup"
            ((error_count++))
        fi
    fi
    
    return $error_count
}

# Send notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if configured)
    if [[ -n "${BACKUP_EMAIL:-}" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "POS Backup $status" "$BACKUP_EMAIL"
    fi
    
    # Webhook notification (if configured)
    if [[ -n "${BACKUP_WEBHOOK:-}" ]] && command -v curl >/dev/null 2>&1; then
        curl -X POST "$BACKUP_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# Main backup function
main() {
    log "Starting POS system backup process..."
    
    check_privileges
    setup_directories
    
    local backup_success=true
    local error_messages=""
    
    # Perform backups
    if ! backup_database; then
        backup_success=false
        error_messages+="Database backup failed. "
    fi
    
    if ! backup_files; then
        backup_success=false
        error_messages+="Files backup failed. "
    fi
    
    if ! backup_config; then
        backup_success=false
        error_messages+="Config backup failed. "
    fi
    
    # Cleanup and verify
    cleanup_old_backups
    
    if ! verify_backups; then
        backup_success=false
        error_messages+="Backup verification failed. "
    fi
    
    # Report results
    if $backup_success; then
        local success_message="POS system backup completed successfully at $(date)"
        log "$success_message"
        send_notification "SUCCESS" "$success_message"
    else
        local failure_message="POS system backup completed with errors: $error_messages"
        error "$failure_message"
        send_notification "FAILURE" "$failure_message"
        exit 1
    fi
    
    log "Backup process finished"
}

# Print usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -r, --retain   Number of days to retain backups (default: 30)"
    echo "  -d, --dir      Backup directory (default: /var/backups/pos)"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_EMAIL   Email address for notifications"
    echo "  BACKUP_WEBHOOK URL for webhook notifications"
    echo ""
    echo "Example:"
    echo "  sudo $0 --retain 14 --dir /backup/pos"
    echo ""
    echo "To set up automated backups, add to crontab:"
    echo "  0 2 * * * /path/to/backup-production.sh >/dev/null 2>&1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -r|--retain)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"

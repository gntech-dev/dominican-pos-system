#!/bin/bash

# ========================================
# POS Dominicana - Production Deployment Script
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pos-dominicana"
DEPLOYMENT_DIR="/var/www/$PROJECT_NAME"
BACKUP_DIR="/backups/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME-deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    local node_version=$(node -v | cut -d 'v' -f 2)
    local required_version="18.0.0"
    if ! dpkg --compare-versions "$node_version" "ge" "$required_version"; then
        error "Node.js version $node_version is less than required $required_version"
    fi
    
    # Check PostgreSQL connectivity
    if ! command -v psql &> /dev/null; then
        warning "PostgreSQL client not found, skipping database connectivity check"
    else
        log "✅ Checking database connectivity..."
        if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            error "Cannot connect to PostgreSQL database"
        fi
    fi
    
    # Check disk space (minimum 2GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 2097152 ]]; then  # 2GB in KB
        error "Insufficient disk space. At least 2GB required."
    fi
    
    success "Pre-deployment checks completed"
}

# Create backup
create_backup() {
    log "📦 Creating backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="backup_${timestamp}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [[ -n "$DATABASE_URL" ]]; then
        log "Backing up database..."
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${backup_name}_database.sql"
        success "Database backup created: ${backup_name}_database.sql"
    fi
    
    # Backup application files (if deployment directory exists)
    if [[ -d "$DEPLOYMENT_DIR" ]]; then
        log "Backing up application files..."
        tar -czf "$BACKUP_DIR/${backup_name}_app.tar.gz" -C "$DEPLOYMENT_DIR" . \
            --exclude='node_modules' \
            --exclude='.next' \
            --exclude='logs' \
            --exclude='.git'
        success "Application backup created: ${backup_name}_app.tar.gz"
    fi
    
    # Keep only last 5 backups
    log "Cleaning old backups..."
    cd "$BACKUP_DIR"
    ls -t backup_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
    ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
    
    success "Backup completed"
}

# Deploy application
deploy_application() {
    log "🚀 Deploying application..."
    
    # Create deployment directory
    mkdir -p "$DEPLOYMENT_DIR"
    cd "$DEPLOYMENT_DIR"
    
    # Pull latest code
    log "Pulling latest code..."
    if [[ -d ".git" ]]; then
        git fetch --all
        git reset --hard origin/main
    else
        error "Git repository not found. Please clone the repository first."
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --only=production
    
    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    log "Running database migrations..."
    npx prisma migrate deploy
    
    # Build application
    log "Building application..."
    npm run build
    
    success "Application deployed successfully"
}

# Configure system services
configure_services() {
    log "⚙️  Configuring system services..."
    
    # Create log directory
    sudo mkdir -p /var/log/$PROJECT_NAME
    sudo chown $USER:$USER /var/log/$PROJECT_NAME
    
    # Create systemd service (if not using PM2)
    if ! command -v pm2 &> /dev/null; then
        log "Creating systemd service..."
        sudo tee /etc/systemd/system/$PROJECT_NAME.service > /dev/null <<EOF
[Unit]
Description=POS Dominicana Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOYMENT_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$PROJECT_NAME
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable $PROJECT_NAME
        success "Systemd service configured"
    fi
}

# Start/restart services
restart_services() {
    log "🔄 Restarting services..."
    
    if command -v pm2 &> /dev/null; then
        log "Using PM2..."
        pm2 reload ecosystem.config.js --env production
        pm2 save
    else
        log "Using systemd..."
        sudo systemctl restart $PROJECT_NAME
        sudo systemctl status $PROJECT_NAME --no-pager -l
    fi
    
    success "Services restarted"
}

# Health check
health_check() {
    log "🏥 Running health check..."
    
    local health_url="http://localhost:3000/api/health"
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_url" > /dev/null; then
            success "Application is healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Waiting for application to start..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Post-deployment tasks
post_deployment() {
    log "📋 Running post-deployment tasks..."
    
    # Warm up the application
    log "Warming up application..."
    curl -s "http://localhost:3000" > /dev/null || true
    curl -s "http://localhost:3000/api/health" > /dev/null || true
    
    # Check logs for errors
    log "Checking for errors in logs..."
    if [[ -f "/var/log/$PROJECT_NAME/$PROJECT_NAME.log" ]]; then
        local recent_errors=$(tail -100 "/var/log/$PROJECT_NAME/$PROJECT_NAME.log" | grep -i error | wc -l)
        if [[ $recent_errors -gt 0 ]]; then
            warning "Found $recent_errors error(s) in recent logs. Please review."
        fi
    fi
    
    success "Post-deployment tasks completed"
}

# Main deployment process
main() {
    log "🚀 Starting deployment of $PROJECT_NAME..."
    
    # Load environment variables
    if [[ -f ".env.production" ]]; then
        set -a
        source .env.production
        set +a
        log "✅ Production environment loaded"
    else
        error ".env.production file not found"
    fi
    
    pre_deployment_checks
    create_backup
    deploy_application
    configure_services
    restart_services
    health_check
    post_deployment
    
    success "🎉 Deployment completed successfully!"
    log "Application is now running at: http://localhost:3000"
    log "Health check: http://localhost:3000/api/health"
}

# Script execution
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    "restart")
        restart_services
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|health|backup|restart}"
        echo "  deploy  - Full deployment (default)"
        echo "  health  - Run health check only"
        echo "  backup  - Create backup only" 
        echo "  restart - Restart services and check health"
        exit 1
        ;;
esac

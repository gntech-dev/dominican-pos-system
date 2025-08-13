#!/bin/bash

# 🔧 Production Environment Setup Script
# POS Dominican Republic - Secure Production Configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 POS Dominican Republic - Production Environment Setup${NC}"
echo "================================================"

# Check if .env.production already exists
if [[ -f ".env.production" ]]; then
    echo -e "${YELLOW}⚠️  .env.production already exists. Creating backup...${NC}"
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
fi

# Generate secure secrets
echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Prompt for configuration values
echo -e "${BLUE}📝 Please provide production configuration:${NC}"

read -p "Domain (e.g., https://pos.yourcompany.com): " DOMAIN
read -p "Database URL (PostgreSQL): " DATABASE_URL
read -p "Business Name: " BUSINESS_NAME
read -p "Business RNC: " BUSINESS_RNC
read -p "Business Address: " BUSINESS_ADDRESS

# Create production environment file
cat > .env.production << EOF
# =========================================
# POS DOMINICANA - PRODUCTION ENVIRONMENT
# Generated: $(date)
# =========================================

# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Security Keys (Auto-generated secure 32+ character strings)
JWT_SECRET="${JWT_SECRET}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Application Configuration
NODE_ENV="production"
NEXTAUTH_URL="${DOMAIN}"

# Business Configuration
BUSINESS_NAME="${BUSINESS_NAME}"
BUSINESS_RNC="${BUSINESS_RNC}"
BUSINESS_ADDRESS="${BUSINESS_ADDRESS}"

# DGII Integration
DGII_API_URL="https://api.dgii.gov.do/rnc"
DGII_SYNC_ENABLED="true"
DGII_SYNC_INTERVAL="86400000"

# Performance Configuration
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"

# Security Configuration
CORS_ORIGIN="${DOMAIN}"
SECURE_COOKIES="true"
SESSION_TIMEOUT="3600000"

# Logging Configuration
LOG_LEVEL="info"
LOG_MAX_SIZE="20m"
LOG_MAX_FILES="10"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"

# Backup Configuration
BACKUP_ENABLED="true"
BACKUP_INTERVAL="daily"
BACKUP_RETENTION="30"
EOF

echo -e "${GREEN}✅ Production environment file created successfully!${NC}"
echo -e "${BLUE}📋 Generated configuration summary:${NC}"
echo "  - Domain: $DOMAIN"
echo "  - Database: [CONFIGURED]"
echo "  - JWT Secret: [32+ CHARACTERS - SECURE]"
echo "  - NextAuth Secret: [32+ CHARACTERS - SECURE]"
echo "  - Business: $BUSINESS_NAME"
echo "  - RNC: $BUSINESS_RNC"

echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "1. The .env.production file contains sensitive secrets"
echo "2. Never commit this file to version control"
echo "3. Ensure file permissions are restrictive (600)"
echo "4. Keep backup of these secrets in secure location"

# Set secure permissions
chmod 600 .env.production
echo -e "${GREEN}✅ Set secure file permissions (600)${NC}"

echo -e "${GREEN}🎉 Production environment setup complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the generated .env.production file"
echo "2. Test database connectivity"
echo "3. Run production deployment: ./deploy.sh"

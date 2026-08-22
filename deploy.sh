#!/usr/bin/env bash

# ==============================================================================
# Expense Tracker Pro - 1-Click Fullstack Production Deployment Script
# Deploys both Backend & Frontend to AWS EC2 (44.195.0.15) & Verifies Health
# ==============================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SERVER_USER="ubuntu"
SERVER_IP="44.195.0.15"
SSH_KEY="$HOME/.ssh/id_rsa_no_pass"
REMOTE_DIR="/home/ubuntu/expanse-tracker-pro"
DOMAIN="https://expensetracker.chandandev.online"

echo -e "\n${CYAN}${BOLD}======================================================"
echo -e "🚀 Starting Expense Tracker Pro Full-Stack Deployment"
echo -e "======================================================${NC}\n"

# 1. Check if running locally or directly on the remote server
if [ "$(hostname -I 2>/dev/null | grep -o '172.31.15.205' || true)" == "172.31.15.205" ] || [ "$PWD" == "$REMOTE_DIR" ]; then
    echo -e "${YELLOW}📍 Detected execution directly on Remote Server.${NC}"
    
    echo -e "\n${CYAN}📦 1/4 Pulling latest Git changes...${NC}"
    cd "$REMOTE_DIR"
    git pull origin main

    echo -e "\n${CYAN}⚙️  2/4 Building Backend (API & Prisma Engine)...${NC}"
    cd "$REMOTE_DIR/backend"
    npm install
    npx prisma generate
    npx prisma db push
    npm run build

    echo -e "\n${CYAN}🎨 3/4 Building Frontend (Next.js Web App)...${NC}"
    cd "$REMOTE_DIR/frontend"
    npm install
    npm run build

    echo -e "\n${CYAN}🔄 4/4 Restarting PM2 Production Services...${NC}"
    pm2 restart expensetracker-backend --update-env
    pm2 restart expensetracker-frontend --update-env
    pm2 save

    echo -e "\n${GREEN}${BOLD}✅ Server-side deployment completed successfully!${NC}\n"
    exit 0
fi

# 2. Local Execution Flow: Push to Git & Trigger Remote Deployment
echo -e "${CYAN}📡 1/4 Checking local Git repository status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted local changes detected. Adding & committing...${NC}"
    git add .
    git commit -m "deploy: automated production release $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo -e "${CYAN}⬆️  2/4 Pushing latest code to GitHub repository...${NC}"
git push origin main

echo -e "\n${CYAN}🌐 3/4 Connecting to Remote Server ($SERVER_IP) & Building...${NC}"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" bash -s << 'EOF'
    set -e
    cd /home/ubuntu/expanse-tracker-pro
    
    echo "  -> Git pulling latest commits..."
    git pull origin main
    
    echo "  -> Building Backend..."
    cd /home/ubuntu/expanse-tracker-pro/backend
    npm install --silent
    npx prisma generate
    npx prisma db push
    npm run build
    
    echo "  -> Building Frontend..."
    cd /home/ubuntu/expanse-tracker-pro/frontend
    npm install --silent
    npm run build
    
    echo "  -> Restarting PM2 Daemons..."
    pm2 restart expensetracker-backend --update-env
    pm2 restart expensetracker-frontend --update-env
    pm2 save
EOF

echo -e "\n${CYAN}🔍 4/4 Verifying Production Endpoints Health...${NC}"
sleep 3
HEALTH_STATUS=$(curl -s -m 8 "$DOMAIN/api/health" || echo "failed")

if echo "$HEALTH_STATUS" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}${BOLD}======================================================"
    echo -e "🎉 DEPLOYMENT SUCCESSFUL & LIVE!"
    echo -e "======================================================${NC}"
    echo -e "🌍 Web App:  ${CYAN}$DOMAIN/${NC}"
    echo -e "⚡ API Root: ${CYAN}$DOMAIN/api/health${NC}"
    echo -e "🤖 AI Engine: Active (Gemini 2.5 Flash Multi-Key)"
    echo -e "📊 Health:   ${GREEN}$HEALTH_STATUS${NC}\n"
else
    echo -e "${RED}⚠️ Deployment finished, but health check returned:${NC} $HEALTH_STATUS\n"
fi

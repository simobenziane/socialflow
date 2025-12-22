#!/bin/bash
# ===========================================
# SocialFlow Update Script
# Pulls latest code from GitHub and rebuilds
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}       SocialFlow Update Script            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

cd "$PROJECT_DIR"

# Check if git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Check current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}Current branch:${NC} $BRANCH"

# Fetch latest
echo -e "\n${YELLOW}Fetching latest changes...${NC}"
git fetch origin

# Check if updates available
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ Already up to date!${NC}"
    exit 0
fi

# Show what's new
echo -e "\n${YELLOW}New commits:${NC}"
git log --oneline HEAD..origin/$BRANCH | head -10

# Confirm update
echo ""
read -p "Update now? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Update cancelled${NC}"
    exit 0
fi

# Pull changes
echo -e "\n${YELLOW}Pulling latest changes...${NC}"
git pull origin $BRANCH

# Detect OS for compose override
COMPOSE_FILES="-f docker-compose.yml"
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -f "docker-compose.mac.yml" ]; then
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.mac.yml"
        echo -e "${BLUE}Using Mac optimizations${NC}"
    fi
fi

# Stop services
echo -e "\n${YELLOW}Stopping services...${NC}"
docker-compose $COMPOSE_FILES down

# Rebuild containers
echo -e "\n${YELLOW}Rebuilding containers...${NC}"
docker-compose $COMPOSE_FILES build

# Start services
echo -e "\n${YELLOW}Starting services...${NC}"
docker-compose $COMPOSE_FILES up -d

# Wait for services
echo -e "\n${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Health check
echo -e "\n${YELLOW}Checking health...${NC}"
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓ n8n is healthy${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Waiting for n8n... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ n8n failed to start${NC}"
    echo "Check logs: docker-compose logs socialflow-n8n"
    exit 1
fi

# Check UI
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UI is healthy${NC}"
else
    echo -e "${YELLOW}⚠ UI may still be starting...${NC}"
fi

# Done
echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}       Update Complete!                     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "UI:  ${BLUE}http://localhost:3000${NC}"
echo -e "n8n: ${BLUE}http://localhost:5678${NC}"
echo ""

# Show current version
if [ -f "VERSION.md" ]; then
    echo -e "${YELLOW}Version:${NC}"
    head -5 VERSION.md
fi

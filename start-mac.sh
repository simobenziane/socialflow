#!/bin/bash
# start-mac.sh - Start all SocialFlow services on Mac

echo "=========================================="
echo "Starting SocialFlow..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 2
    echo -e "${GREEN}✓ Ollama started${NC}"
else
    echo -e "${GREEN}✓ Ollama already running${NC}"
fi

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "Waiting for services to be ready..."
sleep 5

# Check health
echo ""
echo "Service Status:"
echo "---"

# Check n8n
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ n8n is running:      http://localhost:5678${NC}"
else
    echo -e "${RED}✗ n8n is not responding${NC}"
fi

# Check UI
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may still be starting...${NC}"
fi

# Check Ollama
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running:   http://localhost:11434${NC}"
else
    echo -e "${RED}✗ Ollama is not responding${NC}"
fi

# Get data directory from .env
DATA_DIR=$(grep DATA_PATH .env 2>/dev/null | cut -d'=' -f2 || echo "$HOME/socialflow-data")

echo ""
echo "=========================================="
echo -e "${GREEN}SocialFlow is running!${NC}"
echo "=========================================="
echo ""
echo "Open the app: http://localhost:3000"
echo ""
echo -e "${YELLOW}To start Cloudflare tunnel, run in a new terminal:${NC}"
echo "  cloudflared tunnel --url file://$DATA_DIR"
echo ""
echo "To stop: docker-compose down"
echo ""

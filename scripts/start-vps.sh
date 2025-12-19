#!/bin/bash
# start-vps.sh - SocialFlow VPS Startup Script
#
# Starts SocialFlow containers and checks Tailscale connection to local Ollama

echo "=========================================="
echo "SocialFlow - VPS Startup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Check Tailscale
echo "Checking Tailscale..."
if tailscale status > /dev/null 2>&1; then
    VPS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ Tailscale connected (VPS IP: $VPS_IP)${NC}"
else
    echo -e "${RED}✗ Tailscale not connected${NC}"
    echo "  Run: sudo tailscale up"
fi

# Check Ollama via Tailscale
echo ""
echo "Checking Ollama connection..."
if [ -f .env ]; then
    OLLAMA_HOST=$(grep "^OLLAMA_HOST=" .env | cut -d'=' -f2)
    if [ -n "$OLLAMA_HOST" ] && [ "$OLLAMA_HOST" != "http://100.x.x.x:11434" ]; then
        if curl -s "$OLLAMA_HOST/api/version" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ollama reachable at $OLLAMA_HOST${NC}"
        else
            echo -e "${RED}✗ Ollama not reachable at $OLLAMA_HOST${NC}"
            echo "  Ensure Ollama is running on your local machine:"
            echo "  OLLAMA_HOST=0.0.0.0:11434 ollama serve"
        fi
    else
        echo -e "${YELLOW}⚠ OLLAMA_HOST not configured in .env${NC}"
        echo "  Set OLLAMA_HOST to your local machine's Tailscale IP"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
fi

# Start containers
echo ""
echo "Starting Docker containers..."
docker compose -f docker-compose.vps.yml up -d

# Wait and check
echo ""
echo "Checking services..."
sleep 5

# Check n8n
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ n8n: http://localhost:5678${NC}"
else
    echo -e "${YELLOW}.. n8n: Starting up...${NC}"
fi

# Check UI
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UI: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}.. UI: Starting up...${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}VPS Services Started${NC}"
echo "=========================================="
echo ""
echo "To view logs: docker compose -f docker-compose.vps.yml logs -f"
echo "To stop:      docker compose -f docker-compose.vps.yml down"
echo ""

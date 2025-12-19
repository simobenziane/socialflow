#!/bin/bash
# check-health.sh - SocialFlow Health Check Script

# Get script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=========================================="
echo "SocialFlow - Health Check"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check Docker
echo "Checking Docker..."
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Docker is running"
else
    echo -e "${RED}[FAIL]${NC} Docker is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check containers
echo ""
echo "Checking containers..."

if docker ps --format '{{.Names}}' | grep -q "socialflow-n8n"; then
    echo -e "${GREEN}[OK]${NC} socialflow-n8n container is running"
else
    echo -e "${RED}[FAIL]${NC} socialflow-n8n container is not running"
    ERRORS=$((ERRORS + 1))
fi

if docker ps --format '{{.Names}}' | grep -q "socialflow-ui"; then
    echo -e "${GREEN}[OK]${NC} socialflow-ui container is running"
else
    echo -e "${RED}[FAIL]${NC} socialflow-ui container is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check n8n endpoint
echo ""
echo "Checking endpoints..."

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz | grep -q "200"; then
    echo -e "${GREEN}[OK]${NC} n8n: http://localhost:5678"
else
    echo -e "${RED}[FAIL]${NC} n8n is not responding"
    ERRORS=$((ERRORS + 1))
fi

# Check UI endpoint
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}[OK]${NC} UI: http://localhost:3000"
else
    echo -e "${YELLOW}[WARN]${NC} UI may still be starting..."
fi

# Check Ollama
if curl -s http://localhost:11434/api/version >/dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Ollama: http://localhost:11434"
else
    echo -e "${RED}[FAIL]${NC} Ollama is not responding"
    ERRORS=$((ERRORS + 1))
fi

# Check Ollama models
echo ""
echo "Checking Ollama models..."

if ollama list 2>/dev/null | grep -q "llava"; then
    echo -e "${GREEN}[OK]${NC} llava model installed"
else
    echo -e "${YELLOW}[WARN]${NC} llava model not found - run: ollama pull llava:7b"
fi

if ollama list 2>/dev/null | grep -q "llama3"; then
    echo -e "${GREEN}[OK]${NC} llama3 model installed"
else
    echo -e "${YELLOW}[WARN]${NC} llama3 model not found - run: ollama pull llama3.2:3b"
fi

# Check data directory
echo ""
echo "Checking data directory..."

if [ -f .env ]; then
    DATA_PATH=$(grep "^DATA_PATH=" .env | cut -d'=' -f2)
    if [ -d "$DATA_PATH" ]; then
        echo -e "${GREEN}[OK]${NC} Data directory exists: $DATA_PATH"
    else
        echo -e "${YELLOW}[WARN]${NC} Data directory not found: $DATA_PATH"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} .env file not found"
fi

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
else
    echo -e "${RED}$ERRORS error(s) found${NC}"
fi
echo "=========================================="

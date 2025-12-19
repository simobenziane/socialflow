#!/bin/bash
# setup-vps.sh - SocialFlow VPS Interactive Setup (Hybrid with Tailscale)
#
# This script sets up SocialFlow on a VPS with:
# - n8n + Frontend running on VPS
# - Ollama running on your local machine via Tailscale
#
# Prerequisites:
# - Ubuntu/Debian VPS with root access
# - Local machine with Ollama installed
# - Tailscale account (free)

set -e

# Get script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================="
echo "     SocialFlow - VPS Hybrid Setup"
echo -e "==========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: Some commands may require sudo${NC}"
    echo ""
fi

# ===========================================
# Interactive Configuration
# ===========================================

echo -e "${CYAN}--- Configuration ---${NC}"
echo ""

# Ask for data path
echo "Where should SocialFlow store client data?"
DEFAULT_PATH="/opt/socialflow-data"
echo ""
read -p "Data path [$DEFAULT_PATH]: " DATA_PATH
DATA_PATH=${DATA_PATH:-$DEFAULT_PATH}

echo ""
echo -e "Data will be stored in: ${GREEN}$DATA_PATH${NC}"

# Ask for Tailscale IP
echo ""
echo -e "${CYAN}--- Tailscale Configuration ---${NC}"
echo ""
echo "For VPS Hybrid, you need Tailscale to connect to your local Ollama."
echo ""
echo "On your LOCAL machine (where Ollama runs):"
echo "  1. Install Tailscale: https://tailscale.com/download"
echo "  2. Sign in to Tailscale"
echo "  3. Run: tailscale ip -4"
echo "  4. Enter that IP below"
echo ""
read -p "Local machine Tailscale IP (e.g., 100.100.100.2): " TAILSCALE_IP

if [ -z "$TAILSCALE_IP" ]; then
    echo -e "${YELLOW}No Tailscale IP provided. You'll need to edit .env later.${NC}"
    OLLAMA_HOST="http://100.x.x.x:11434"
else
    OLLAMA_HOST="http://$TAILSCALE_IP:11434"
    echo -e "Ollama will be accessed at: ${GREEN}$OLLAMA_HOST${NC}"
fi

# ===========================================
# Install Dependencies
# ===========================================

echo ""
echo -e "${CYAN}--- Installing Dependencies ---${NC}"
echo ""

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${YELLOW}Note: You may need to log out and back in for docker group${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get update -qq
    sudo apt-get install -y docker-compose-plugin
fi
echo -e "${GREEN}✓ Docker Compose available${NC}"

# Install Tailscale
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    echo -e "${GREEN}✓ Tailscale installed${NC}"
else
    echo -e "${GREEN}✓ Tailscale already installed${NC}"
fi

# Start Tailscale if not connected
if ! tailscale status &> /dev/null; then
    echo ""
    echo "Starting Tailscale..."
    sudo tailscale up
fi

# Get VPS Tailscale IP
VPS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓ VPS Tailscale IP: $VPS_IP${NC}"

# ===========================================
# Create Configuration
# ===========================================

echo ""
echo -e "${CYAN}--- Creating Configuration ---${NC}"
echo ""

# Create data directory
echo "Creating data directory..."
sudo mkdir -p "$DATA_PATH/_config/agents"
sudo chown -R $USER:$USER "$DATA_PATH"
echo -e "${GREEN}✓ Created $DATA_PATH${NC}"

# Create .env file
echo "Creating .env file..."
cp .env.vps.example .env 2>/dev/null || cp .env.example .env

# Update DATA_PATH in .env
sed -i "s|DATA_PATH=.*|DATA_PATH=$DATA_PATH|g" .env

# Update OLLAMA_HOST in .env
if [ -n "$OLLAMA_HOST" ]; then
    sed -i "s|OLLAMA_HOST=.*|OLLAMA_HOST=$OLLAMA_HOST|g" .env
fi

echo -e "${GREEN}✓ Created .env${NC}"

# ===========================================
# Build and Start Docker
# ===========================================

echo ""
echo -e "${CYAN}--- Building Docker Containers ---${NC}"
echo ""

docker compose -f docker-compose.vps.yml build
echo -e "${GREEN}✓ Containers built (VPS mode)${NC}"

echo ""
echo "Starting containers..."
docker compose -f docker-compose.vps.yml up -d
echo -e "${GREEN}✓ Containers started${NC}"

# ===========================================
# Initialize Database
# ===========================================

echo ""
echo -e "${CYAN}--- Initializing Database ---${NC}"
echo ""

echo "Waiting for n8n to start..."
MAX_ATTEMPTS=30
ATTEMPT=0
N8N_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$N8N_READY" = "false" ]; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        N8N_READY=true
    else
        ATTEMPT=$((ATTEMPT + 1))
        sleep 2
    fi
done

if [ "$N8N_READY" = "true" ]; then
    echo -e "${GREEN}✓ n8n is ready${NC}"
    docker exec socialflow-n8n sh /opt/scripts/init-db.sh
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${YELLOW}⚠ n8n not responding. Initialize manually:${NC}"
    echo "  docker exec socialflow-n8n sh /opt/scripts/init-db.sh"
fi

# ===========================================
# Done!
# ===========================================

echo ""
echo -e "${CYAN}=========================================="
echo -e "${GREEN}     VPS Setup Complete!"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo "VPS Tailscale IP: $VPS_IP"
echo "Data directory: $DATA_PATH"
echo ""
echo "Services (internal):"
echo -e "  UI:   ${CYAN}http://127.0.0.1:3000${NC}"
echo -e "  n8n:  ${CYAN}http://127.0.0.1:5678${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Configure nginx reverse proxy with SSL"
echo "   See docs/VPS_HYBRID.md for nginx configuration"
echo ""
echo "2. On your LOCAL machine:"
echo "   a. Keep Tailscale running"
echo "   b. Start Ollama: OLLAMA_HOST=0.0.0.0:11434 ollama serve"
echo ""
echo "3. Test Tailscale connection from VPS:"
echo "   curl $OLLAMA_HOST/api/version"
echo ""
if [ "$TAILSCALE_IP" = "" ]; then
    echo -e "${YELLOW}4. Update .env with your local Tailscale IP:${NC}"
    echo "   Edit .env and set OLLAMA_HOST=http://<your-local-tailscale-ip>:11434"
    echo "   Then restart: docker compose -f docker-compose.vps.yml up -d"
    echo ""
fi
echo "Daily commands:"
echo "  make vps-start  - Start services"
echo "  make vps-stop   - Stop services"
echo "  make health     - Check status"
echo ""

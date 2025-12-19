#!/bin/bash
# setup-linux.sh - SocialFlow Linux (Ubuntu/Debian) Setup
# Called from setup.sh or run directly

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

# Check if running with --no-prompt (called from setup.sh)
NO_PROMPT=false
if [ "$1" = "--no-prompt" ]; then
    NO_PROMPT=true
fi

if [ "$NO_PROMPT" = "false" ]; then
    echo ""
    echo -e "${CYAN}=========================================="
    echo "     SocialFlow - Linux Setup"
    echo -e "==========================================${NC}"
    echo ""
fi

# ===========================================
# Install Dependencies
# ===========================================

echo "Checking and installing dependencies..."
echo ""

# Update package list
echo "Updating package list..."
sudo apt-get update -qq

# Check/install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${YELLOW}Note: You may need to log out and back in for docker group to take effect${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Check/install Docker Compose (v2)
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Check/install curl (usually present)
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    sudo apt-get install -y curl
    echo -e "${GREEN}✓ curl installed${NC}"
fi

# Check/install git
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt-get install -y git
    echo -e "${GREEN}✓ git installed${NC}"
else
    echo -e "${GREEN}✓ git already installed${NC}"
fi

# Get deploy type from environment (set by setup.sh)
DEPLOY_TYPE="${DEPLOY_TYPE:-local}"

# Install Ollama (for local deployment only)
if [ "$DEPLOY_TYPE" = "local" ]; then
    if ! command -v ollama &> /dev/null; then
        echo "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        echo -e "${GREEN}✓ Ollama installed${NC}"
    else
        echo -e "${GREEN}✓ Ollama already installed${NC}"
    fi
fi

# Install Tailscale (for VPS deployment)
if [ "$DEPLOY_TYPE" = "vps" ]; then
    if ! command -v tailscale &> /dev/null; then
        echo "Installing Tailscale..."
        curl -fsSL https://tailscale.com/install.sh | sh
        echo -e "${GREEN}✓ Tailscale installed${NC}"
        echo ""
        echo -e "${YELLOW}Run 'sudo tailscale up' to connect to your Tailscale network${NC}"
    else
        echo -e "${GREEN}✓ Tailscale already installed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✓ All Linux dependencies installed${NC}"

# If running standalone (not from setup.sh), show next steps
if [ "$NO_PROMPT" = "false" ]; then
    echo ""
    echo -e "${CYAN}=========================================="
    echo "     Linux Dependencies Ready!"
    echo -e "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Run the interactive setup:"
    echo "     ./scripts/setup.sh"
    echo ""
    echo "  2. Or configure manually:"
    echo "     cp .env.example .env"
    echo "     # Edit .env with your settings"
    echo "     docker-compose up -d --build"
    echo ""
fi

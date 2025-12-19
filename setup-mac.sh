#!/bin/bash
# setup-mac.sh - SocialFlow Mac Setup Script

set -e  # Exit on error

echo "=========================================="
echo "SocialFlow - Mac Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS only${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
echo "Step 1: Checking prerequisites..."
echo "---"

# Check Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✓ Homebrew installed${NC}"
fi

# Check Docker
if ! command_exists docker; then
    echo -e "${YELLOW}Installing Docker Desktop...${NC}"
    brew install --cask docker
    echo -e "${YELLOW}Please start Docker Desktop manually, then re-run this script${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop and re-run this script${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Check Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}Installing Ollama...${NC}"
    brew install ollama
else
    echo -e "${GREEN}✓ Ollama installed${NC}"
fi

# Check Cloudflared
if ! command_exists cloudflared; then
    echo -e "${YELLOW}Installing Cloudflare Tunnel...${NC}"
    brew install cloudflared
else
    echo -e "${GREEN}✓ Cloudflared installed${NC}"
fi

echo ""
echo "Step 2: Setting up data directory..."
echo "---"

# Create data directory
DATA_DIR="$HOME/socialflow-data"
mkdir -p "$DATA_DIR/_config/agents"
echo -e "${GREEN}✓ Created $DATA_DIR${NC}"

echo ""
echo "Step 3: Creating .env file..."
echo "---"

# Create .env if not exists
if [ ! -f .env ]; then
    if [ -f .env.mac.example ]; then
        cp .env.mac.example .env
    else
        cp .env.example .env
    fi
    # Update DATA_PATH for Mac
    sed -i '' "s|DATA_PATH=.*|DATA_PATH=$DATA_DIR|g" .env
    echo -e "${GREEN}✓ Created .env with DATA_PATH=$DATA_DIR${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists, checking DATA_PATH...${NC}"
    if grep -q "C:/" .env; then
        echo -e "${YELLOW}  Updating Windows path to Mac path...${NC}"
        sed -i '' "s|DATA_PATH=C:/Clients|DATA_PATH=$DATA_DIR|g" .env
        echo -e "${GREEN}✓ Updated DATA_PATH to $DATA_DIR${NC}"
    fi
fi

echo ""
echo "Step 4: Pulling Ollama models..."
echo "---"

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Pull required models
echo "Pulling llava:7b (vision model)..."
ollama pull llava:7b

echo "Pulling llama3.2:3b (text model)..."
ollama pull llama3.2:3b

echo -e "${GREEN}✓ Ollama models ready${NC}"

echo ""
echo "Step 5: Building Docker containers..."
echo "---"

docker-compose build

echo -e "${GREEN}✓ Docker containers built${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "2. Initialize the database (first time only):"
echo "   docker exec socialflow-n8n sh /opt/scripts/init-db.sh"
echo ""
echo "3. Import workflows in n8n:"
echo "   Open http://localhost:5678"
echo "   Import workflows from files/workflows/ folder"
echo ""
echo "4. Start Cloudflare tunnel (in a new terminal):"
echo "   cloudflared tunnel --url file://$DATA_DIR"
echo ""
echo "5. Open the application:"
echo "   http://localhost:3000"
echo ""
echo "Data directory: $DATA_DIR"
echo ""

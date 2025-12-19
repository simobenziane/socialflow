#!/bin/bash
# setup.sh - SocialFlow Interactive Setup
# Single entry point for all platforms

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
echo "     SocialFlow - Interactive Setup"
echo -e "==========================================${NC}"
echo ""

# Detect OS
detect_os() {
    case "$OSTYPE" in
        darwin*)  echo "mac" ;;
        linux*)   echo "linux" ;;
        msys*|mingw*|cygwin*) echo "windows" ;;
        *)        echo "unknown" ;;
    esac
}

OS=$(detect_os)
echo -e "Detected OS: ${GREEN}$OS${NC}"
echo ""

# Windows redirect
if [ "$OS" = "windows" ]; then
    echo -e "${YELLOW}Windows detected via Git Bash/MSYS${NC}"
    echo ""
    echo "Please run the PowerShell setup instead:"
    echo ""
    echo -e "  ${CYAN}.\\scripts\\setup-windows.ps1${NC}"
    echo ""
    echo "Or copy this command:"
    echo "  powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1"
    echo ""
    exit 0
fi

# Unknown OS
if [ "$OS" = "unknown" ]; then
    echo -e "${RED}Unknown OS: $OSTYPE${NC}"
    echo "Please follow manual setup in docs/SETUP.md"
    exit 1
fi

# ===========================================
# Interactive Configuration
# ===========================================

echo -e "${CYAN}--- Configuration ---${NC}"
echo ""

# Ask deployment mode
echo "How will you deploy SocialFlow?"
echo ""
echo "  1) Local machine (everything runs here)"
echo "  2) VPS Hybrid (n8n on VPS, Ollama on local machine via Tailscale)"
echo ""
read -p "Select [1/2] (default: 1): " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-1}

if [ "$DEPLOY_MODE" = "2" ]; then
    DEPLOY_TYPE="vps"
    echo ""
    echo -e "${GREEN}VPS Hybrid mode selected${NC}"
else
    DEPLOY_TYPE="local"
    echo ""
    echo -e "${GREEN}Local deployment selected${NC}"
fi

# Ask for data path
echo ""
echo "Where should SocialFlow store client data?"
if [ "$OS" = "mac" ]; then
    DEFAULT_PATH="$HOME/socialflow-data"
else
    DEFAULT_PATH="$HOME/socialflow-data"
fi

if [ "$DEPLOY_TYPE" = "vps" ]; then
    DEFAULT_PATH="/opt/socialflow-data"
fi

echo ""
read -p "Data path [$DEFAULT_PATH]: " DATA_PATH
DATA_PATH=${DATA_PATH:-$DEFAULT_PATH}

# Expand ~ if used
DATA_PATH="${DATA_PATH/#\~/$HOME}"

echo ""
echo -e "Data will be stored in: ${GREEN}$DATA_PATH${NC}"

# For VPS mode, ask for Tailscale IP
OLLAMA_HOST=""
if [ "$DEPLOY_TYPE" = "vps" ]; then
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
fi

# ===========================================
# Create Configuration
# ===========================================

echo ""
echo -e "${CYAN}--- Creating Configuration ---${NC}"
echo ""

# Create data directory
echo "Creating data directory..."
mkdir -p "$DATA_PATH/_config/agents"
echo -e "${GREEN}✓ Created $DATA_PATH${NC}"

# Create .env file
echo "Creating .env file..."
if [ "$DEPLOY_TYPE" = "vps" ]; then
    cp .env.vps.example .env
else
    if [ "$OS" = "mac" ]; then
        cp .env.mac.example .env
    else
        cp .env.example .env
    fi
fi

# Update DATA_PATH in .env
if [ "$OS" = "mac" ]; then
    sed -i '' "s|DATA_PATH=.*|DATA_PATH=$DATA_PATH|g" .env
else
    sed -i "s|DATA_PATH=.*|DATA_PATH=$DATA_PATH|g" .env
fi

# Update OLLAMA_HOST for VPS
if [ "$DEPLOY_TYPE" = "vps" ] && [ -n "$OLLAMA_HOST" ]; then
    if [ "$OS" = "mac" ]; then
        sed -i '' "s|OLLAMA_HOST=.*|OLLAMA_HOST=$OLLAMA_HOST|g" .env
    else
        sed -i "s|OLLAMA_HOST=.*|OLLAMA_HOST=$OLLAMA_HOST|g" .env
    fi
fi

echo -e "${GREEN}✓ Created .env${NC}"

# ===========================================
# Run Platform-Specific Setup
# ===========================================

echo ""
echo -e "${CYAN}--- Installing Dependencies ---${NC}"
echo ""

if [ "$OS" = "mac" ]; then
    # Run Mac setup (non-interactive parts)
    source "$SCRIPT_DIR/setup-mac.sh" --no-prompt
elif [ "$OS" = "linux" ]; then
    # Run Linux setup
    if [ -f "$SCRIPT_DIR/setup-linux.sh" ]; then
        source "$SCRIPT_DIR/setup-linux.sh" --no-prompt
    else
        echo -e "${YELLOW}Running Linux setup...${NC}"

        # Check/install Docker
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com | sh
            sudo usermod -aG docker $USER
            echo -e "${GREEN}✓ Docker installed${NC}"
            echo -e "${YELLOW}Note: You may need to log out and back in for docker group${NC}"
        else
            echo -e "${GREEN}✓ Docker already installed${NC}"
        fi

        # Check/install Ollama (for local deployment)
        if [ "$DEPLOY_TYPE" = "local" ]; then
            if ! command -v ollama &> /dev/null; then
                echo "Installing Ollama..."
                curl -fsSL https://ollama.com/install.sh | sh
                echo -e "${GREEN}✓ Ollama installed${NC}"
            else
                echo -e "${GREEN}✓ Ollama already installed${NC}"
            fi
        fi

        # For VPS, install Tailscale
        if [ "$DEPLOY_TYPE" = "vps" ]; then
            if ! command -v tailscale &> /dev/null; then
                echo "Installing Tailscale..."
                curl -fsSL https://tailscale.com/install.sh | sh
                echo -e "${GREEN}✓ Tailscale installed${NC}"
            else
                echo -e "${GREEN}✓ Tailscale already installed${NC}"
            fi
        fi
    fi
fi

# ===========================================
# Pull Ollama Models (local only)
# ===========================================

if [ "$DEPLOY_TYPE" = "local" ]; then
    echo ""
    echo -e "${CYAN}--- Pulling Ollama Models ---${NC}"
    echo ""

    # Start Ollama if not running
    if ! pgrep -x "ollama" > /dev/null; then
        echo "Starting Ollama..."
        ollama serve &
        sleep 3
    fi

    echo "Pulling llava:7b (vision model)..."
    ollama pull llava:7b

    echo "Pulling llama3.2:3b (text model)..."
    ollama pull llama3.2:3b

    echo -e "${GREEN}✓ Models ready${NC}"
fi

# ===========================================
# Build and Start Docker
# ===========================================

echo ""
echo -e "${CYAN}--- Building Docker Containers ---${NC}"
echo ""

if [ "$DEPLOY_TYPE" = "vps" ]; then
    docker-compose -f docker-compose.vps.yml build
    echo -e "${GREEN}✓ Containers built (VPS mode)${NC}"

    echo ""
    echo "Starting containers..."
    docker-compose -f docker-compose.vps.yml up -d
else
    docker-compose build
    echo -e "${GREEN}✓ Containers built${NC}"

    echo ""
    echo "Starting containers..."
    docker-compose up -d
fi

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
echo -e "${GREEN}     Setup Complete!"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo "Services:"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "  n8n:       ${CYAN}http://localhost:5678${NC}"
if [ "$DEPLOY_TYPE" = "local" ]; then
    echo -e "  Ollama:    ${CYAN}http://localhost:11434${NC}"
fi
echo ""
echo "Data directory: $DATA_PATH"
echo ""

if [ "$DEPLOY_TYPE" = "vps" ]; then
    echo -e "${YELLOW}VPS Hybrid Next Steps:${NC}"
    echo ""
    echo "1. Configure nginx with SSL (see docs/VPS_HYBRID.md)"
    echo ""
    echo "2. On your LOCAL machine:"
    echo "   - Keep Tailscale running"
    echo "   - Start Ollama: OLLAMA_HOST=0.0.0.0:11434 ollama serve"
    echo ""
    echo "3. Test Tailscale connection:"
    echo "   curl $OLLAMA_HOST/api/version"
    echo ""
else
    echo "Next steps:"
    echo ""
    echo "1. Import workflows in n8n:"
    echo "   Open http://localhost:5678"
    echo "   Import from workflows/ folder"
    echo ""
    echo "2. Start Cloudflare tunnel (for media):"
    echo "   cloudflared tunnel --url file://$DATA_PATH"
    echo ""
    echo "3. Open the app:"
    echo "   http://localhost:3000"
fi
echo ""
echo "Daily commands:"
echo "  make start   - Start services"
echo "  make stop    - Stop services"
echo "  make health  - Check status"
echo ""

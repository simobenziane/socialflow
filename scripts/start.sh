#!/bin/bash
# start.sh - Universal SocialFlow Startup Script
# Detects OS and runs appropriate startup

# Get script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=========================================="
echo "SocialFlow - Starting Services"
echo "=========================================="
echo ""

# Detect OS
case "$OSTYPE" in
    darwin*)
        if [ -f "$SCRIPT_DIR/start-mac.sh" ]; then
            chmod +x "$SCRIPT_DIR/start-mac.sh"
            "$SCRIPT_DIR/start-mac.sh"
        else
            echo "Running default startup..."

            # Start Ollama if not running
            if ! pgrep -x "ollama" > /dev/null; then
                echo "Starting Ollama..."
                ollama serve &
                sleep 2
            fi

            # Start containers
            docker-compose up -d

            echo ""
            echo "Services started!"
            echo "  UI:     http://localhost:3000"
            echo "  n8n:    http://localhost:5678"
            echo "  Ollama: http://localhost:11434"
        fi
        ;;

    linux*)
        # Start Ollama if not running
        if ! pgrep -x "ollama" > /dev/null; then
            echo "Starting Ollama..."
            ollama serve &
            sleep 2
        fi

        # Start containers
        docker-compose up -d

        echo ""
        echo "Services started!"
        echo "  UI:     http://localhost:3000"
        echo "  n8n:    http://localhost:5678"
        echo "  Ollama: http://localhost:11434"
        ;;

    msys*|mingw*|cygwin*)
        echo "Please run the PowerShell startup script:"
        echo ""
        echo "  .\\scripts\\start-windows.ps1"
        echo ""
        ;;

    *)
        echo "Running default startup..."
        docker-compose up -d
        ;;
esac

# SocialFlow Makefile
# Simple commands for managing the application

.PHONY: setup start stop restart logs health clean init-db pull-models build ui help update vps-setup vps-start vps-stop

# Default target
help:
	@echo "SocialFlow - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Setup:"
	@echo "  make setup       - Run initial setup (detects OS)"
	@echo "  make build       - Build Docker containers"
	@echo "  make ui          - Rebuild and restart UI (after frontend changes)"
	@echo "  make update      - Pull latest from GitHub and rebuild"
	@echo "  make init-db     - Initialize database"
	@echo "  make pull-models - Pull Ollama models"
	@echo ""
	@echo "Running:"
	@echo "  make start       - Start all services"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo ""
	@echo "VPS Hybrid:"
	@echo "  make vps-setup   - Setup VPS with Tailscale"
	@echo "  make vps-start   - Start VPS services"
	@echo "  make vps-stop    - Stop VPS services"
	@echo ""
	@echo "Monitoring:"
	@echo "  make logs        - View container logs"
	@echo "  make health      - Check service health"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       - Remove containers and volumes"
	@echo ""

# Setup - detect OS and run appropriate script
setup:
ifeq ($(OS),Windows_NT)
	@echo "Windows detected - run: .\scripts\setup-windows.ps1"
else
	@chmod +x scripts/setup.sh && ./scripts/setup.sh
endif

# Build containers
build:
	docker-compose build

# Rebuild and restart UI container (use after frontend changes)
# IMPORTANT: Always use this instead of npm run dev - the UI is served on port 3000 via Docker
ui:
	docker compose build socialflow-ui && docker compose up -d socialflow-ui

# Start services
start:
ifeq ($(OS),Windows_NT)
	@echo "Starting services..."
	@powershell -Command "if (!(Get-Process ollama -ErrorAction SilentlyContinue)) { Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden }"
	docker-compose up -d
else
	@chmod +x scripts/start.sh && ./scripts/start.sh
endif

# Stop services
stop:
	docker-compose down

# Restart services
restart: stop start

# View logs
logs:
	docker-compose logs -f

# Health check
health:
ifeq ($(OS),Windows_NT)
	@powershell -File scripts/check-health.ps1
else
	@chmod +x scripts/check-health.sh && ./scripts/check-health.sh
endif

# Initialize database
init-db:
	docker exec socialflow-n8n sh /opt/scripts/init-db.sh

# Pull Ollama models
pull-models:
	ollama pull llava:7b
	ollama pull llama3.2:3b

# Update from GitHub and rebuild
update:
ifeq ($(OS),Windows_NT)
	@echo "Pulling latest changes..."
	git pull origin main
	docker-compose build
	docker-compose up -d
else
	@chmod +x scripts/update.sh && ./scripts/update.sh
endif

# Clean up everything
clean:
	docker-compose down -v --remove-orphans
	@echo "Containers and volumes removed."
	@echo "Note: Data in DATA_PATH is preserved."

# ===========================================
# VPS Hybrid Commands
# ===========================================

vps-setup:
	@chmod +x scripts/setup-vps.sh && ./scripts/setup-vps.sh

vps-start:
	@chmod +x scripts/start-vps.sh && ./scripts/start-vps.sh

vps-stop:
	docker-compose -f docker-compose.vps.yml down

vps-logs:
	docker-compose -f docker-compose.vps.yml logs -f

vps-build:
	docker-compose -f docker-compose.vps.yml build

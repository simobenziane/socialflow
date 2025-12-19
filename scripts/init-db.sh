#!/bin/bash
# ===========================================
# SocialFlow Database Initialization Script
# ===========================================
# This script initializes the SQLite database and config files if they don't exist.
# Run this once after first container startup:
#   docker exec socialflow-n8n sh /opt/scripts/init-db.sh

set -e

CONFIG_DIR="/data/clients/_config"
DB_PATH="$CONFIG_DIR/socialflow.db"
SCHEMA_PATH="/opt/scripts/schema.sql"
SETTINGS_TEMPLATE="/opt/config-templates/settings.json"
AGENTS_DIR="$CONFIG_DIR/agents"
AGENTS_TEMPLATE="/opt/config-templates/agents"

echo "═══════════════════════════════════════════════════════════════"
echo "  SocialFlow - Initialization Check"
echo "═══════════════════════════════════════════════════════════════"

# Create directory structure
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Creating config directory: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

if [ ! -d "$AGENTS_DIR" ]; then
    echo "Creating agents directory: $AGENTS_DIR"
    mkdir -p "$AGENTS_DIR"
fi

# Copy default settings if not exists
if [ ! -f "$CONFIG_DIR/settings.json" ]; then
    if [ -f "$SETTINGS_TEMPLATE" ]; then
        echo "Copying default settings.json..."
        cp "$SETTINGS_TEMPLATE" "$CONFIG_DIR/settings.json"
        echo "  Created: $CONFIG_DIR/settings.json"
    else
        echo "Warning: settings.json template not found at $SETTINGS_TEMPLATE"
    fi
else
    echo "Settings file already exists: $CONFIG_DIR/settings.json"
fi

# Copy agent prompts if not exists
if [ -d "$AGENTS_TEMPLATE" ]; then
    for prompt in "$AGENTS_TEMPLATE"/*.md; do
        if [ -f "$prompt" ]; then
            filename=$(basename "$prompt")
            if [ ! -f "$AGENTS_DIR/$filename" ]; then
                echo "Copying agent prompt: $filename"
                cp "$prompt" "$AGENTS_DIR/$filename"
            fi
        fi
    done
    echo "Agent prompts ready in: $AGENTS_DIR"
else
    echo "Warning: Agent templates not found at $AGENTS_TEMPLATE"
fi

# Initialize database if not exists
if [ ! -f "$DB_PATH" ]; then
    if [ -f "$SCHEMA_PATH" ]; then
        echo "Initializing SQLite database..."
        sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
        echo "  Database initialized at: $DB_PATH"
    else
        echo "Warning: Schema file not found at $SCHEMA_PATH"
        echo "  Creating empty database..."
        sqlite3 "$DB_PATH" "SELECT 1;"
    fi
else
    echo "Database already exists at: $DB_PATH"
fi

# Create empty active_job.json if not exists
if [ ! -f "$CONFIG_DIR/active_job.json" ]; then
    echo '{"active": false}' > "$CONFIG_DIR/active_job.json"
    echo "Created: $CONFIG_DIR/active_job.json"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Initialization complete!"
echo ""
echo "  Next steps:"
echo "  1. Open n8n at http://localhost:5678"
echo "  2. Import workflows from /opt/workflows/"
echo "  3. Configure Late API credentials"
echo "  4. Start Cloudflare tunnel and update Settings"
echo "═══════════════════════════════════════════════════════════════"

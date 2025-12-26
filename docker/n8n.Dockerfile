# Custom n8n image with better-sqlite3 for database operations
FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

# Install better-sqlite3 globally (for init script and workflow use)
# The n8n image is minimal/distroless, so we skip system packages
RUN npm install -g better-sqlite3

# Also install in n8n's node_modules for direct access
RUN cd /usr/local/lib/node_modules/n8n && \
    npm install better-sqlite3 --save-optional || true

# Create uploads directory
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads

# Switch back to node user
USER node

# Use the default entrypoint/command from the base n8n image

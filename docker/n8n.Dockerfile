# Custom n8n image with better-sqlite3 for database operations
FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

# Install better-sqlite3 in /opt/node-libs (not mounted by volumes)
RUN mkdir -p /opt/node-libs && cd /opt/node-libs && npm init -y && npm install better-sqlite3

# Also install in n8n's node_modules for workflow use
RUN cd /usr/local/lib/node_modules/n8n && \
    npm install better-sqlite3 --save-optional || true

# Create uploads directory
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads

# Switch back to node user
USER node

# Use the default entrypoint/command from the base n8n image

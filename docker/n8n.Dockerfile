# Custom n8n image with better-sqlite3 for database operations
FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

# Install better-sqlite3 in /opt/node-libs (for init script)
RUN mkdir -p /opt/node-libs && cd /opt/node-libs && npm init -y && npm install better-sqlite3

# Install better-sqlite3 globally
RUN npm install -g better-sqlite3

# Set NODE_PATH so all node processes can find global modules
ENV NODE_PATH=/usr/local/lib/node_modules

# Create uploads directory
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads

# Switch back to node user
USER node

# Use the default entrypoint/command from the base n8n image

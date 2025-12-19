# Custom n8n image with ffmpeg for video processing
FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

# Install ffmpeg for video frame extraction and sqlite3 for database management
RUN apk add --no-cache ffmpeg sqlite

# Create uploads directory
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads

# Switch back to node user
USER node

# Use the default entrypoint/command from the base n8n image

# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application (NestJS sẽ tạo ra thư mục dist chứa các file build)
RUN npm run build

# Create database directory for volume mount
RUN mkdir -p /app/data && chmod 755 /app/data

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Initializing database..."' >> /app/start.sh && \
    echo 'npm run init-db' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'npm run start:prod' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port 8080
EXPOSE 8080

# Create volume for database persistence
VOLUME ["/app/data"]

# Start the application with database initialization
CMD ["/app/start.sh"]
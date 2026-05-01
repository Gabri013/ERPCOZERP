# Dockerfile for backend service
FROM node:18

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Instala só dependências de runtime; migrate/seed/start não precisam de devDependencies
RUN npm ci --silent --omit=dev
RUN npm rebuild bcrypt --build-from-source

# Copy application files
COPY src/ ./src/
COPY .env.example ./

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Run the application
CMD ["npm", "start"]

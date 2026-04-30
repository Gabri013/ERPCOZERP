# Dockerfile for backend service
FROM node:18

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm install --silent && npm rebuild bcrypt --build-from-source

# Copy application files
COPY src/ ./src/
COPY .env.example ./

# Expose port
EXPOSE 3001

# Run the application
CMD ["npm", "run", "dev"]

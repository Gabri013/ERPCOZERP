# Dockerfile for backend service
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --silent && npm rebuild bcrypt --build-from-source
COPY . .
EXPOSE 3001
CMD ["npm","run","dev"]
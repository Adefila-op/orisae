FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000 3001

# Start both frontend and backend
CMD ["sh", "-c", "npm start & npm run api"]

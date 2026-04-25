# Elite Master Data Engine Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Secure environment
ENV NODE_ENV=production

# Health check for orchestration
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

EXPOSE 10000

CMD ["node", "server.js"]

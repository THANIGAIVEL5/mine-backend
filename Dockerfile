FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source
COPY . .

# Environment configuration
ENV PORT=10000
ENV NODE_ENV=production
ENV ENABLE_LOCAL_AI=false

EXPOSE 10000

CMD ["node", "server.js"]

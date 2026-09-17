FROM node:20-bookworm-slim

WORKDIR /app

# Environment variables for model cache and port
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_HOME=/app/.cache
ENV NODE_ENV=production
ENV PORT=10000
ENV LOCAL_AI_MODEL=HuggingFaceTB/SmolLM2-360M-Instruct
ENV ENABLE_LOCAL_AI=true

# Install native compilation dependencies for sqlite3 C++ addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install node dependencies and rebuild sqlite3 from source for current GLIBC
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
RUN npm rebuild sqlite3 --build-from-source

# Copy source code including scripts
COPY . .

# Pre-cache and bake HuggingFaceTB/SmolLM2-360M-Instruct into Docker image
RUN node scripts/download_model.js

EXPOSE 10000

# Optimize V8 garbage collection and memory heap for cloud deployment
CMD ["node", "--max-old-space-size=350", "--optimize-for-size", "server.js"]

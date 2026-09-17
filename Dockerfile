FROM node:20-bookworm-slim

WORKDIR /app

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

# Runtime settings
ENV PORT=10000
ENV NODE_ENV=production
ENV ENABLE_LOCAL_AI=false
ENV LOCAL_AI_MODEL=HuggingFaceTB/SmolLM2-360M-Instruct

EXPOSE 10000

CMD ["node", "server.js"]

FROM python:3.11-slim

WORKDIR /app

# Install Node.js for TypeScript build step
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy package requirements
COPY package*.json tsconfig.json ./
RUN npm ci || npm install

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Build TypeScript to public/js/
RUN npm run build:ts

# Cloud Run defaults to PORT 8080
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}



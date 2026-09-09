FROM ubuntu:24.04

WORKDIR /usr/src/app

# Install Node.js 20 and build essentials on Ubuntu 24.04 (provides GLIBC 2.39+)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    build-essential \
    python3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
ENV PORT=3000

CMD [ "npm", "start" ]


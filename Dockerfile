# Stage 1: Build TypeScript Frontend
FROM node:20-alpine AS ts-builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build:ts

# Stage 2: Build Rust High-Performance Engine
FROM rust:1.80-slim AS rust-builder
WORKDIR /app
COPY rust_backend ./rust_backend
WORKDIR /app/rust_backend
RUN cargo build --release

# Stage 3: Minimal Production Runtime
FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy compiled Rust binary
COPY --from=rust-builder /app/rust_backend/target/release/terra-pulse-os /app/terra-pulse-os

# Copy static assets and HTML views
COPY --from=ts-builder /app/public ./public
COPY --from=ts-builder /app/views ./views

ENV PORT=8080
EXPOSE 8080

CMD ["/app/terra-pulse-os"]




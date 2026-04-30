FROM node:20-bookworm-slim

# Container layout mirrors the layers/ monorepo structure:
#   /app/cognitive/     ← WORKDIR: package.json, tsconfig.json, src/, node_modules/
#   /app/shared/        ← shared modules (rootDir: ".." from /app/cognitive → /app/)
#
# With rootDir: ".." tsc emits:
#   /app/cognitive/dist/cognitive/src/index.js  (not dist/index.js)
WORKDIR /app/cognitive

# Install curl for downloading binaries
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY layers/cognitive/package.json ./
RUN npm install

# Install mcp-remote for PostHog MCP bridge
RUN npm install -g mcp-remote@latest

# Install Engram binary (Phase 3 C3 — Contact Memory)
# Version pinned to v1.10.7 (stable) — do NOT use latest
ENV ENGRAM_VERSION=1.10.7
RUN curl -L "https://github.com/Gentleman-Programming/engram/releases/download/v${ENGRAM_VERSION}/engram_${ENGRAM_VERSION}_linux_amd64.tar.gz" \
    -o /tmp/engram.tar.gz \
    && tar -xzf /tmp/engram.tar.gz -C /tmp \
    && mv /tmp/engram /usr/local/bin/engram \
    && chmod +x /usr/local/bin/engram \
    && rm /tmp/engram.tar.gz \
    && engram version

COPY layers/cognitive/tsconfig.json ./
COPY layers/cognitive/src/ ./src/
# Copy shared one level up → /app/shared/ (matches rootDir: ".." → /app/)
COPY layers/shared/ /app/shared/

RUN npm run build

# rootDir: ".." causes tsc to nest output: dist/cognitive/src/index.js
CMD ["node", "dist/cognitive/src/index.js"]

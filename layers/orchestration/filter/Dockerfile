FROM node:20-alpine

# The filter's own src/shared/ contains local types.
# We copy layers/shared/logging/ into src/shared/logging/ so the
# existing imports '../shared/logging' resolve without tsconfig changes.
WORKDIR /app

COPY layers/orchestration/filter/package.json ./
RUN npm install --production=false

COPY layers/orchestration/filter/tsconfig.json ./
COPY layers/orchestration/filter/src/ ./src/
# Overlay shared logging into the filter's own src/shared/ directory
COPY layers/shared/logging/ ./src/shared/logging/

RUN npm run build

EXPOSE 3000

# rootDir: "." + include src/**/* → tsc emits dist/src/index.js
CMD ["node", "dist/src/index.js"]

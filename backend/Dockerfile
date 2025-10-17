# Multi-stage build: install deps and build, then run
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional

# copy source and build
COPY . .
RUN npm run build

# runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --production

# copy build output
COPY --from=builder /app/dist ./dist

# create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/main.js"]

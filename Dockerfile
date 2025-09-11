FROM node:20-alpine

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=5174

EXPOSE 5174
CMD ["node","--loader","tsx","server/index.ts"]


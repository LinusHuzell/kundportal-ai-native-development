# Development image for the frontend (Vite dev server).
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
# vite.config.ts sets host: true so the server is reachable from outside the container.
CMD ["npm", "run", "dev"]

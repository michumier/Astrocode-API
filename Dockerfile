# ---- Base: dependencias ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Desarrollo: recarga automática con nodemon (lo usa docker-compose) ----
FROM base AS dev
COPY . .
EXPOSE 4000
# -L (legacy watch) para que detecte cambios en volúmenes montados desde Windows
CMD ["npx", "nodemon", "-L", "--watch", "src", "--ext", "ts", "--exec", "ts-node", "src/index.ts"]

# ---- Build: compila TypeScript a JavaScript ----
FROM base AS build
COPY . .
RUN npm run build

# ---- Producción: solo JS compilado y dependencias de runtime ----
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]

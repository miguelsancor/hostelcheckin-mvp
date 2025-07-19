# Etapa 1: build
FROM node:18-slim AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: producción
FROM node:18-slim

WORKDIR /app

# Instala `serve` para servir contenido estático
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Sirve la app desde /dist
CMD ["serve", "-s", "dist", "-l", "5173"]

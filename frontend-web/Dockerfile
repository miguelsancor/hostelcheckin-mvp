# Etapa 1: build con Vite
FROM node:18-slim as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: contenedor con servidor estático
FROM node:18-slim
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 5180
CMD ["serve", "-s", "dist", "-l", "5180"]

FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluye prisma)
RUN npm install

# Copiar el resto del código
COPY . .

# Generar Prisma Client usando node directamente
RUN node node_modules/prisma/build/index.js generate

# (Opcional) limpiar devDependencies para producción
# RUN npm prune --omit=dev

EXPOSE 4000
CMD ["npm", "run", "dev"]

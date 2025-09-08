FROM node:18-alpine

WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluye prisma)
RUN npm ci

# Copiar el resto del código
COPY . .

# Dar permisos y generar Prisma Client
RUN chmod +x ./node_modules/.bin/prisma && npx prisma generate

# Quitar devDependencies para dejar la imagen liviana
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["npm", "run", "dev"]

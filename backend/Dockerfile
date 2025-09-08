FROM node:18-alpine

WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar dependencias en modo producción
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

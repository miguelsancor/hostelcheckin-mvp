FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo package.json y package-lock.json primero
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN chmod +x ./node_modules/.bin/prisma \
  && npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

FROM node:18-alpine

WORKDIR /app

# 1) Instalar TODAS las deps para poder generar Prisma
COPY package*.json ./
RUN npm ci

# 2) Copiar el código
COPY . .

# 3) Generar Prisma Client (si tuviste issues de permiso, descomenta la línea de chmod)
# RUN chmod +x ./node_modules/.bin/prisma
RUN npx prisma generate

# 4) Dejar la imagen liviana (quitar devDependencies)
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

# Generar Prisma Client
RUN chmod +x ./node_modules/.bin/prisma \
  && npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

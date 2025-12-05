FROM node:18-slim

WORKDIR /app

# Copiar SOLO los package del frontend
COPY ./package.json ./package-lock.json ./

RUN npm install --legacy-peer-deps

# Copiar todo el frontend
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

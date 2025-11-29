FROM node:18-slim

WORKDIR /app

# ⛔ ANTES: copiaba los package del root
# COPY package*.json ./

# ✔ AHORA: copia los package DEL FRONTEND
COPY ./package.json ./package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

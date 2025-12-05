FROM node:18-slim

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

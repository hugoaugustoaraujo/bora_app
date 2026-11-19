FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --include=dev && npm install -g tsx

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
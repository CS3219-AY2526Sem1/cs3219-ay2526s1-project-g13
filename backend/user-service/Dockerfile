FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

EXPOSE 8080

CMD ["pnpm", "start"]

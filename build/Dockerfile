FROM node:18.18.2-slim as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./src ./src

COPY tsconfig.json ./

RUN npm run build

FROM node:18.18.2-slim

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./

RUN npm install --only=production

COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
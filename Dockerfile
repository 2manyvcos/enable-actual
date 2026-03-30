FROM node:lts

WORKDIR /app

COPY package.json package-lock.json .
RUN npm install
COPY src src

EXPOSE 3000

VOLUME /data
ENV DATA_DIR=/data

CMD [ "node", "src/server.js" ]

FROM node:lts

WORKDIR /app

RUN adduser app
RUN chown app:app /app
USER app

COPY --chown=app:app package.json package-lock.json .
RUN npm install
COPY --chown=app:app src src

EXPOSE 3000

VOLUME /data
ENV DATA_DIR=/data
ENV EB_PRIVATE_KEY_FILE=/data/private.pem

CMD [ "node", "." ]

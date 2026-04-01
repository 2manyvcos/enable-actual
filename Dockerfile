FROM node:lts AS base

WORKDIR /app

RUN adduser app
RUN chown app:app /app
USER app

FROM base AS builder

COPY --chown=app:app package.json package-lock.json ./
RUN npm install

COPY --chown=app:app ./ ./
RUN npm run client:build

FROM base

COPY --from=builder --chown=app:app /app/client/dist/ ./client/dist/
COPY --from=builder --chown=app:app /app/node_modules/ ./node_modules/
COPY --from=builder --chown=app:app /app/src/ ./src/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

EXPOSE 3000

VOLUME /data
ENV DATA_DIR=/data
ENV EB_PRIVATE_KEY_FILE=/data/private.pem

CMD [ "node", "." ]

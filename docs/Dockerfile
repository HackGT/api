# syntax=docker/dockerfile:1

FROM node:14-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY . .

RUN yarn install --production --pure-lockfile --non-interactive
RUN yarn build && yarn build docs

CMD yarn workspace @api/docs start
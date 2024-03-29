# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:16-alpine as base

ARG SERVICE
ENV SERVICE=${SERVICE}

ENV NODE_ENV=production

# ---- Release ----
FROM base AS release

WORKDIR /app

COPY ["package.json", "tsconfig.base.json", "tsconfig.json", "yarn.lock", "./"]
COPY ./common ./common
COPY ./config ./config
COPY ./services/$SERVICE ./services/$SERVICE

RUN yarn install --production --pure-lockfile --non-interactive

RUN yarn workspace @api/services-${SERVICE} build

CMD yarn workspace @api/services-${SERVICE} start
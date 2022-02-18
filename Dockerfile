# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:14-alpine as base

ARG SERVICE
ENV SERVICE=${SERVICE}

ENV NODE_ENV=production

# ---- Release ----
FROM base AS release

WORKDIR /app

# COPY ["package.json", "tsconfig.base.json", "tsconfig.json", "yarn.lock", "./"]
# COPY ./common ./common
# COPY ./config ./config
# COPY ./services/$SERVICE ./services/$SERVICE

COPY . .

RUN yarn install --production --pure-lockfile --non-interactive

RUN yarn build && yarn build services/$SERVICE

CMD yarn workspace @api/services-${SERVICE} start
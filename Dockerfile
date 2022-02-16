# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:14-alpine as base

ARG SERVICE
ENV SERVICE=${SERVICE}

ENV NODE_ENV=production

# ---- Build ----
FROM base AS build

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]
COPY common/package.json ./common
COPY config/package.json ./config

COPY services/$SERVICE/package.json ./services/$SERVICE

RUN yarn install

# ---- Release ----
FROM base AS release

WORKDIR /app

# copy production node_modules
COPY --from=build /app/node_modules ./

# copy app sources
COPY . .

CMD yarn workspace @api/services-${SERVICE} start
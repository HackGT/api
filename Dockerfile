# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:14-alpine AS build

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install

# ---- Release ----
FROM node:14-alpine AS release

ENV NODE_ENV=production

WORKDIR /app

# copy production node_modules
COPY --from=build /app/node_modules ./

# copy app sources
COPY . .

CMD []
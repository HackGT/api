#!/bin/bash
cd "$(dirname "$0")"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}" \
HEXATHON_SHORT_CODE="${HEXATHON_SHORT_CODE:-test}" \
POSTGRES_URI="postgres://postgres@localhost" \
POSTGRES_URI_EXPO_SERVICE="postgres://postgres@localhost/expo" \
../../node_modules/.bin/ts-node prisma/seed-load-test.ts

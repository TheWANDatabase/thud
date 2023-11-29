FROM node:21.2.0-alpine3.17 as build

WORKDIR /app

COPY ./src src
COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .
RUN bun install


FROM node:21.2.0-alpine3.17 as runtime

WORKDIR /app

COPY --from=build /app .
CMD ["bun", "src/main.ts"]
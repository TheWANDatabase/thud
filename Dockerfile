FROM node:21.2.0-alpine3.17 as build
LABEL authors="altrius"


# Create app directory
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./tsconfig.json .
COPY ./src ./src
RUN apk add --no-cache git openssh
RUN npm i -g typescript

# Install dependencies
RUN npm install
RUN npm run build

FROM node:21.2.0-alpine3.17 as production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json .
COPY --from=build /usr/src/app/package-lock.json .

CMD ["node", "dist/main"]
FROM node:lts-alpine AS development
ENV NODE_ENV development
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN yarn
COPY --chown=node:node . .
EXPOSE 3000
USER node
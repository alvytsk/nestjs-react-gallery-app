FROM node:18-alpine AS development
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN yarn
COPY --chown=node:node . .
EXPOSE 3000
USER node
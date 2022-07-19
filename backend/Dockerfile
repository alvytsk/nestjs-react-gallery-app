# https://www.tomray.dev/nestjs-docker-production

FROM node:18-alpine AS development
# Create app directory
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN yarn
COPY --chown=node:node . .
USER node

# FROM node:12.19.0-alpine3.9 as production
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install --only=production
# COPY . .
# COPY --from=development /usr/src/app/dist ./dist
# CMD ["node", "dist/main"]

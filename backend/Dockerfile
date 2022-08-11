# https://www.tomray.dev/nestjs-docker-production
FROM --platform=linux/amd64 node:18-alpine AS development

# RUN apk update && apk add --no-cache vips vips-dev libc-dev libc6-compat
# RUN apk add --no-cache ffmpeg

RUN apk upgrade -U \ 
  && apk add ffmpeg\
  && rm -rf /var/cache/*

# Create app directory
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm install --verbose
# RUN npm install --force --verbose --arch=x64 --platform=darwin --libc=musl sharp
COPY --chown=node:node . .

RUN	su node \
  && npm install sharp --g --production --unsafe-perm \
  && chown node:node /usr/local/lib/node_modules -R

USER node

# && apk --no-cache add --virtual .build-dependencies g++ make python curl tar gtk-doc gobject-introspection expat-dev glib-dev libpng-dev libjpeg-turbo-dev giflib-dev librsvg-dev  \

# FROM node:12.19.0-alpine3.9 as production
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install --only=production
# COPY . .
# COPY --from=development /usr/src/app/dist ./dist
# CMD ["node", "dist/main"]

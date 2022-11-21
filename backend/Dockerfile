# https://www.tomray.dev/nestjs-docker-production

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:lts-bullseye-slim AS development

# Create app directory
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .

RUN	su node \
  && npm install sharp --g --production --unsafe-perm \
  && chown node:node /usr/local/lib/node_modules -R

USER node

# CMD ["npm", "run", "start:dev"]

###################
# BUILD FOR PRODUCTION
###################

FROM node:lts-bullseye-slim AS build

WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN npm install --production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:lts-bullseye-slim AS production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

RUN	su node \
  && npm install sharp --g --production --unsafe-perm \
  && chown node:node /usr/local/lib/node_modules -R

# Start the server using the production build
CMD ["node", "dist/main"]
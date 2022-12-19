FROM alvytsk/node-ffmpeg as base

############################################
FROM base as dev-dependencies

# Environment Variables
ARG LIBVIPS_VERSION_MAJOR_MINOR=8.13
ARG LIBVIPS_VERSION_PATCH=3
ARG ALPINE_VERSION=3.16

# Install dependencies
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/community" >> /etc/apk/repositories && \
    apk update && \
    apk upgrade && \
    apk add --update \
    zlib libxml2 libxslt glib libexif lcms2 fftw ca-certificates \
    giflib libpng libwebp orc tiff poppler-glib librsvg && \
    \
    apk add --no-cache --virtual .build-dependencies autoconf automake build-base cmake \
    pkgconfig git libtool nasm zlib-dev libxml2-dev libxslt-dev glib-dev \
    libexif-dev lcms2-dev fftw-dev giflib-dev libpng-dev libwebp-dev orc-dev tiff-dev \
    poppler-dev librsvg-dev libheif-dev wget && \
    \
    echo 'Install libvips' && \
    export PKG_CONFIG_PATH=/usr/lib/pkgconfig:/opt/ffmpeg/lib/pkgconfig:/usr/share/pkgconfig && \
    wget -O- https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION_MAJOR_MINOR}.${LIBVIPS_VERSION_PATCH}/vips-${LIBVIPS_VERSION_MAJOR_MINOR}.${LIBVIPS_VERSION_PATCH}.tar.gz | tar xzC /tmp && \
    cd /tmp/vips-${LIBVIPS_VERSION_MAJOR_MINOR}.${LIBVIPS_VERSION_PATCH} && \
    ./configure --prefix=/usr \
                --without-gsf \
                --enable-debug=no \
                --disable-dependency-tracking \
                --disable-static \
                --enable-silent-rules && \
    make install && \
    apk add --no-cache libheif glib-dev 

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile


############################################
FROM dev-dependencies as development

RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build


############################################
FROM base as production

WORKDIR /app
ENV NODE_ENV=production
COPY --from=dev-dependencies /usr/lib /usr/lib
COPY --from=dev-dependencies /app/node_modules ./node_modules
COPY --from=development      /app/build        ./build
COPY package.json yarn.lock ./
CMD [ "node", "build/app.js" ]
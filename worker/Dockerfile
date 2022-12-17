FROM alvytsk/node-ffmpeg as development

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

WORKDIR /usr/src/app
COPY . .
RUN yarn && yarn build
    
RUN echo 'Cleanup' && \
    rm -rf /tmp/vips-${LIBVIPS_VERSION_MAJOR_MINOR}.${LIBVIPS_VERSION_PATCH} && \
    apk del --purge .build-dependencies && \
    rm -rf /var/cache/apk/*


FROM development AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package.json .
RUN npm ci --only=production
COPY --from=development ./usr/src/app/build ./build
CMD [ "node", "build/app.js" ]
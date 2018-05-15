FROM node:alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PKGNAME=graphicsmagick
ENV PKGVER=1.3.29
ENV PKGSOURCE=https://netix.dl.sourceforge.net/project/$PKGNAME/$PKGNAME/$PKGVER/GraphicsMagick-$PKGVER.tar.lz
RUN apk add --update g++ \
                     gcc \
                     make \
                     lzip \
                     wget \
                     coreutils \
                     libjpeg-turbo-dev \
                     libpng-dev \
                     libtool \
                     libgomp && \
    wget --no-check-certificate $PKGSOURCE && \
    lzip -d -c GraphicsMagick-$PKGVER.tar.lz | tar -xvf - && \
    cd GraphicsMagick-$PKGVER && \
    ./configure \
      --build=$CBUILD \
      --host=$CHOST \
      --prefix=/usr \
      --sysconfdir=/etc \
      --mandir=/usr/share/man \
      --infodir=/usr/share/info \
      --localstatedir=/var \
      --enable-shared \
      --disable-static \
      --with-modules \
      --with-threads \
      --with-gs-font-dir=/usr/share/fonts/Type1 \
      --with-quantum-depth=16 && \
    make && \
    make install && \
    rm -rf /usr/src/app/GraphicsMagick-$PKGVER && \
    rm -rf /usr/src/app/GraphicsMagick-$PKGVER.tar.lz && \
    rm -rf /var/cache/apk/* \
    apk del g++ \
            gcc \
            make \
            lzip \
            wget

RUN apk update \
    && apk add --update git \
    && apk add curl \
    && apk add imagemagick \
    && rm -rf /tmp/* /var/cache/apk/*

COPY package.json .
COPY .env .
COPY app.js .
COPY crops.js .
COPY script/entry.sh entry.sh
COPY script/remove_tmp.sh remove_tmp.sh
RUN chmod 755 entry.sh
RUN chmod 755 remove_tmp.sh
ADD script/crontab /var/spool/cron/crontabs/root
RUN chmod 0600 /var/spool/cron/crontabs/root

RUN yarn install

EXPOSE 3000
CMD ["/bin/bash","/usr/src/app/entry.sh"]
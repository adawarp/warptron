#!/bin/sh

VERSION="2020.7"
DIR_NAME="momo-${VERSION}_raspberry-pi-os_armv8"
TAR_NAME="momo-${VERSION}_raspberry-pi-os_armv8.tar.gz"
DOWNLOAD_URL="https://github.com/shiguredo/momo/releases/download/${VERSION}/${TAR_NAME}"

wget $DOWNLOAD_URL && tar xvf $TAR_NAME && mv "${DIR_NAME}/momo" ./ && rm -f $TAR_NAME && sudo rm -rf $DIR_NAME

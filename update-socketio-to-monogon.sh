#!/bin/bash
VERSION="4.7.4"
OUTPUT_DIR="public/js/socket.io"

# Download npm package
curl -o socketio.tgz "https://registry.npmjs.org/socket.io-client/-/socket.io-client-${VERSION}.tgz"
tar -xzf socketio.tgz

# Copy what you need
mkdir -p ${OUTPUT_DIR}
cp -r package/dist ${OUTPUT_DIR}/

# Cleanup
rm -rf package socketio.tgz

echo "Socket.IO ${VERSION} fully downloaded to ${OUTPUT_DIR}"
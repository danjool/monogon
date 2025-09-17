#!/bin/bash
VERSION="0.180.0"
OUTPUT_DIR="public/js/three"

# Download npm package
curl -o three.tgz "https://registry.npmjs.org/three/-/three-${VERSION}.tgz"
tar -xzf three.tgz

# Copy what you need
mkdir -p ${OUTPUT_DIR}
cp -r package/build ${OUTPUT_DIR}/
cp -r package/examples ${OUTPUT_DIR}/

# Cleanup
rm -rf package three.tgz

echo "Three.js ${VERSION} fully downloaded to ${OUTPUT_DIR}"
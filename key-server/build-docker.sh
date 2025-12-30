#!/bin/bash

# Build Docker image for Key Server
IMAGE_NAME="tuienn/key-server"
VERSION=${1:-latest}

echo "Building image: $IMAGE_NAME:$VERSION"
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -eq 0 ]; then
    echo "✓ Build successful: $IMAGE_NAME:$VERSION"
else
    echo "✗ Build failed"
    exit 1
fi


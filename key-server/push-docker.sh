#!/bin/bash

# Push Docker image to Docker Hub
IMAGE_NAME="tuienn/key-server"
VERSION=${1:-latest}

echo "Pushing image: $IMAGE_NAME:$VERSION"
docker push $IMAGE_NAME:$VERSION

if [ $? -eq 0 ]; then
    echo "✓ Push successful: $IMAGE_NAME:$VERSION"
else
    echo "✗ Push failed"
    exit 1
fi


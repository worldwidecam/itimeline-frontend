#!/bin/bash

# Install dependencies
npm install

# Build the project
npm run build

# No need to copy files as we're using staticPublishPath: ./build in render.yaml

#! /usr/bin/env bash

SOURCE_IMAGE=$1
TARGET_DIR=$2

convert $SOURCE_IMAGE  -bordercolor white -border 0 \
          \( -clone 0 -resize 16x16 \) \
          \( -clone 0 -resize 32x32 \) \
          \( -clone 0 -resize 48x48 \) \
          \( -clone 0 -resize 64x64 \) \
          -delete 0 -alpha off -colors 256 $TARGET_DIR/favicon.ico
convert $SOURCE_IMAGE -resize 16x16 $TARGET_DIR/favicon-16x16.png
convert $SOURCE_IMAGE -resize 32x32 $TARGET_DIR/favicon-32x32.png
convert $SOURCE_IMAGE -resize 48x48 $TARGET_DIR/favicon-48x48.png
convert $SOURCE_IMAGE -resize 180x180 $TARGET_DIR/apple-touch-icon.png
convert $SOURCE_IMAGE -resize 192x192 $TARGET_DIR/android-chrome-192x192.png
convert $SOURCE_IMAGE -resize 512x512 $TARGET_DIR/android-chrome-512x512.png

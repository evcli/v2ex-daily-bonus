#!/bin/bash
# Build script for V2EX Daily Bonus extension

VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
OUTPUT="v2ex_daily_bonus_v${VERSION}.zip"

echo "🔨 Building V2EX Daily Bonus v${VERSION}..."

# Remove old build if exists
if [ -f "$OUTPUT" ]; then
    rm "$OUTPUT"
    echo "🗑️  Removed old build"
fi

# Create ZIP package
zip -r "$OUTPUT" . \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "PUBLISH.md" \
  -x "README.md" \
  -x "build.sh" \
  -x "*.zip"

if [ $? -eq 0 ]; then
    echo "✅ Package created: $OUTPUT"
    echo "📦 File size: $(du -h "$OUTPUT" | cut -f1)"
    echo ""
    echo "🚀 Ready to upload to Chrome Web Store!"
    echo "   Dashboard: https://chrome.google.com/webstore/devconsole"
else
    echo "❌ Build failed!"
    exit 1
fi

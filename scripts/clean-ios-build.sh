#!/bin/bash

# iOS Build Cache Cleanup Script
# This script cleans iOS build caches to resolve issues with deleted files

echo "🧹 Cleaning iOS build caches..."

# Clean React Native caches
echo "Cleaning React Native caches..."
npx react-native clean

# Clean iOS build folder
echo "Cleaning iOS build folder..."
rm -rf ios/build

# Clean Pods
echo "Cleaning CocoaPods..."
cd ios
rm -rf Pods
rm -f Podfile.lock
pod install --repo-update
cd ..

# Clean Xcode derived data (if running from React Native project)
echo "Cleaning Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "✅ iOS build cache cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Open your iOS project in Xcode"
echo "2. Product → Clean Build Folder (Cmd+Shift+K)"
echo "3. Try building again"
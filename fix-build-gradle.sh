#!/bin/bash

# Fix build.gradle specifically
# Run from: /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

echo "🔧 Fixing android/app/build.gradle..."

# Check if the dependency is already there
if grep -q "react-native-realtime-audio-analysis" android/app/build.gradle; then
    echo "✅ Dependency already exists in build.gradle"
else
    # Create backup
    cp android/app/build.gradle android/app/build.gradle.backup2
    
    # Add the dependency after the react-native line
    sed -i '' '/implementation "com.facebook.react:react-native:+"/a\
    implementation project(":react-native-realtime-audio-analysis")
' android/app/build.gradle

    echo "✅ Added dependency to build.gradle"
fi

echo ""
echo "Checking build.gradle content:"
grep -A 5 -B 5 "react-native-realtime-audio-analysis" android/app/build.gradle || echo "❌ Not found in build.gradle"
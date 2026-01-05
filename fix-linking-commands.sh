#!/bin/bash

# Manual Linking Fix for AudioAnalysisApp
# Run these commands from your React Native app root: /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

echo "🔧 Fixing React Native Module Linking..."

# 1. Add to android/settings.gradle
echo "1. Adding to android/settings.gradle..."
cat >> android/settings.gradle << 'EOF'

// react-native-realtime-audio-analysis
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
EOF

echo "✅ Added to settings.gradle"

# 2. Add to android/app/build.gradle
echo "2. Adding to android/app/build.gradle..."

# Create a backup first
cp android/app/build.gradle android/app/build.gradle.backup

# Add the dependency
sed -i '' '/dependencies {/a\
    implementation project(":react-native-realtime-audio-analysis")
' android/app/build.gradle

echo "✅ Added to build.gradle"

# 3. Add to MainApplication.kt
echo "3. Adding to MainApplication.kt..."

# Create a backup
cp android/app/src/main/java/com/audioanalysisapp/MainApplication.kt android/app/src/main/java/com/audioanalysisapp/MainApplication.kt.backup

# Add import
sed -i '' '/import com.facebook.react.defaults.DefaultReactNativeHost/a\
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
' android/app/src/main/java/com/audioanalysisapp/MainApplication.kt

# Add package registration
sed -i '' '/PackageList(this).packages.apply {/a\
            add(RealtimeAudioAnalyzerPackage())
' android/app/src/main/java/com/audioanalysisapp/MainApplication.kt

echo "✅ Added to MainApplication.kt"

echo ""
echo "🎉 Manual linking complete!"
echo ""
echo "Next steps:"
echo "1. cd android && ./gradlew clean && cd .."
echo "2. npx react-native run-android"
echo ""
echo "If you see errors, check the backup files created:"
echo "- android/app/build.gradle.backup"
echo "- android/app/src/main/java/com/audioanalysisapp/MainApplication.kt.backup"
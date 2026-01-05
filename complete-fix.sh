#!/bin/bash

# Complete fix for AudioAnalysisApp
# Run this from: /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

echo "🔧 Applying complete manual linking fix..."

# 1. Add to settings.gradle
echo "1. Updating android/settings.gradle..."
cat >> android/settings.gradle << 'EOF'

include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
EOF

# 2. Backup and update build.gradle
echo "2. Updating android/app/build.gradle..."
cp android/app/build.gradle android/app/build.gradle.backup

# Add dependency after the react-native line
sed -i '' '/implementation "com.facebook.react:react-native:+"/a\
    implementation project(":react-native-realtime-audio-analysis")
' android/app/build.gradle

# 3. Backup and update MainApplication.kt
echo "3. Updating MainApplication.kt..."
cp android/app/src/main/java/com/audioanalysisapp/MainApplication.kt android/app/src/main/java/com/audioanalysisapp/MainApplication.kt.backup

# Add import after other imports
sed -i '' '/import com.facebook.react.defaults.DefaultReactNativeHost/a\
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
' android/app/src/main/java/com/audioanalysisapp/MainApplication.kt

# Add package registration
sed -i '' '/return PackageList(this).packages.apply {/a\
            add(RealtimeAudioAnalyzerPackage())
' android/app/src/main/java/com/audioanalysisapp/MainApplication.kt

echo "✅ Manual linking complete!"
echo ""
echo "Next steps:"
echo "1. cd android && ./gradlew clean && cd .."
echo "2. npx react-native run-android"
echo ""
echo "To verify the fix worked:"
echo "node debug-module-linking.js"
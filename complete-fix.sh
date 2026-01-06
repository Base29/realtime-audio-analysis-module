#!/bin/bash

# Complete fix for AudioAnalysisApp
# Run this from: /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

echo "🔧 Applying complete manual linking fix..."

# 1. Add to settings.gradle (only if not already present)
echo "1. Updating android/settings.gradle..."
if ! grep -q "react-native-realtime-audio-analysis" android/settings.gradle; then
    cat >> android/settings.gradle << 'EOF'

include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
EOF
    echo "   ✅ Added to settings.gradle"
else
    echo "   ✅ Already present in settings.gradle"
fi

# 2. Backup and update build.gradle (only if not already present)
echo "2. Updating android/app/build.gradle..."
if ! grep -q "react-native-realtime-audio-analysis" android/app/build.gradle; then
    cp android/app/build.gradle android/app/build.gradle.backup
    
    # Add dependency after the react-native line
    sed -i '' '/implementation "com.facebook.react:react-native:+"/a\
    implementation project(":react-native-realtime-audio-analysis")
' android/app/build.gradle
    echo "   ✅ Added to build.gradle"
else
    echo "   ✅ Already present in build.gradle"
fi

# 3. Update MainApplication.kt with smart pattern detection
echo "3. Updating MainApplication.kt..."

# Find the MainApplication.kt file
MAIN_APP_FILE=""
if [ -f "android/app/src/main/java/com/audioanalysisapp/MainApplication.kt" ]; then
    MAIN_APP_FILE="android/app/src/main/java/com/audioanalysisapp/MainApplication.kt"
elif [ -f "android/app/src/main/kotlin/com/audioanalysisapp/MainApplication.kt" ]; then
    MAIN_APP_FILE="android/app/src/main/kotlin/com/audioanalysisapp/MainApplication.kt"
else
    # Search for any MainApplication file
    MAIN_APP_FILE=$(find android/app/src -name "*MainApplication*" -type f | head -1)
fi

if [ -z "$MAIN_APP_FILE" ]; then
    echo "   ❌ MainApplication file not found!"
    echo "   Please manually add the import and package registration."
    echo "   See docs/MainApplication-examples.md for guidance."
    exit 1
fi

echo "   Found MainApplication at: $MAIN_APP_FILE"

# Check if already updated
if grep -q "RealtimeAudioAnalyzerPackage" "$MAIN_APP_FILE"; then
    echo "   ✅ Already updated with RealtimeAudioAnalyzerPackage"
else
    # Backup the file
    cp "$MAIN_APP_FILE" "${MAIN_APP_FILE}.backup"
    
    # Add import (find a good place after other imports)
    if grep -q "import com.facebook.react.defaults.DefaultReactNativeHost" "$MAIN_APP_FILE"; then
        sed -i '' '/import com.facebook.react.defaults.DefaultReactNativeHost/a\
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
' "$MAIN_APP_FILE"
    elif grep -q "import com.facebook.react.ReactPackage" "$MAIN_APP_FILE"; then
        sed -i '' '/import com.facebook.react.ReactPackage/a\
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
' "$MAIN_APP_FILE"
    else
        # Add after the package declaration
        sed -i '' '/^package /a\
\
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
' "$MAIN_APP_FILE"
    fi
    
    # Add package registration - try different patterns
    if grep -q "PackageList(this).packages.apply {" "$MAIN_APP_FILE"; then
        # Pattern 1: New architecture with apply block
        sed -i '' '/PackageList(this)\.packages\.apply {/a\
                add(RealtimeAudioAnalyzerPackage())
' "$MAIN_APP_FILE"
        echo "   ✅ Added to PackageList with apply block"
    elif grep -q "packages.add(" "$MAIN_APP_FILE"; then
        # Pattern 2: Legacy with packages.add
        sed -i '' '/packages\.add(/a\
        packages.add(RealtimeAudioAnalyzerPackage())
' "$MAIN_APP_FILE"
        echo "   ✅ Added to packages list"
    elif grep -q "Arrays.asList" "$MAIN_APP_FILE"; then
        # Pattern 3: Arrays.asList pattern
        sed -i '' '/MainReactPackage(),/a\
          RealtimeAudioAnalyzerPackage(),
' "$MAIN_APP_FILE"
        echo "   ✅ Added to Arrays.asList"
    else
        echo "   ⚠️  Could not automatically add package registration"
        echo "   Please manually add: add(RealtimeAudioAnalyzerPackage())"
        echo "   See docs/MainApplication-examples.md for guidance"
    fi
fi

echo ""
echo "✅ Manual linking complete!"
echo ""
echo "Next steps:"
echo "1. cd android && ./gradlew clean && cd .."
echo "2. npx react-native run-android"
echo ""
echo "To verify the fix worked:"
echo "node debug-module-linking.js"
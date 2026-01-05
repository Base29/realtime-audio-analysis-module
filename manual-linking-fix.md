# Manual Linking Fix for Local Module

If autolinking failed, follow these exact steps:

## Android Manual Linking

### 1. Add to android/settings.gradle

Add these lines at the end of `android/settings.gradle`:

```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
```

### 2. Add to android/app/build.gradle

In the `dependencies` section of `android/app/build.gradle`, add:

```gradle
dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-native:+"
    
    // Add this line:
    implementation project(':react-native-realtime-audio-analysis')
    
    // ... other dependencies
}
```

### 3. Register in MainApplication

Find your `MainApplication.java` or `MainApplication.kt` file in:
`android/app/src/main/java/com/yourapp/MainApplication.java`

**For Java:**
```java
import com.realtimeaudio.RealtimeAudioAnalyzerPackage;

@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    
    // Add this line:
    packages.add(new RealtimeAudioAnalyzerPackage());
    
    return packages;
}
```

**For Kotlin:**
```kotlin
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

override fun getPackages(): ReactPackageList {
    return PackageList(this).apply {
        // Add this line:
        add(RealtimeAudioAnalyzerPackage())
    }
}
```

### 4. Clean and Rebuild

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## iOS Manual Linking

### 1. Add to Podfile

In `ios/Podfile`, add this line inside your target:

```ruby
target 'YourApp' do
  config = use_native_modules!
  
  # Add this line:
  pod 'RealtimeAudioAnalyzer', :path => '../node_modules/react-native-realtime-audio-analysis'
  
  # ... rest of your pods
end
```

### 2. Install Pods

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx react-native run-ios
```

## Verification

After manual linking, test the module:

```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

console.log('Module:', RealtimeAudioAnalyzer);
// Should not be undefined
```
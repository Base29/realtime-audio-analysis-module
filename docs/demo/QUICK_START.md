# Rich Audio Demo - Quick Start Guide

Get up and running with the Rich Audio Demo component in minutes.

## Installation

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

## Platform Setup

### iOS Configuration

Add microphone usage description to your `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to analyze audio in real-time</string>
```

**Required**: Without this entry, your app will crash when requesting microphone permission on iOS.

### Android Configuration

Add microphone permission to your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Note**: This permission requires runtime request on Android 6.0+ (API level 23+). The RichAudioDemo component handles this automatically.

## Basic Usage

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function App() {
  return (
    <View style={styles.container}>
      <RichAudioDemo
        autoStart={true}
        showDebug={false}
        barCount={32}
        onError={(error) => console.error('Audio error:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Enhanced Features (New!)

The demo component now includes professional-grade visual enhancements:

### Real-time dB Value Display
- Professional audio level indicators in dB
- Color-coded levels (green/yellow/orange/red)
- Both dB and linear values shown

### Session Statistics
- Min/Max/Average audio levels over time
- Sample count tracking
- Automatic reset on start/stop

### Enhanced Visuals
- Frequency labels on spectrum visualizer
- dB scale markers
- Improved color gradients and layout

## Next Steps

- **[Usage Guide](./USAGE_GUIDE.md)** - Complete usage examples and patterns
- **[Enhanced Features](./ENHANCED_FEATURES.md)** - Detailed guide to new visual features
- **[Customization Examples](./CUSTOMIZATION_EXAMPLES.md)** - Theming and layout examples
- **[Performance Guide](./PERFORMANCE_GUIDE.md)** - Optimization strategies
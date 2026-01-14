# Rich Audio Demo - Usage Guide

This guide provides detailed examples and best practices for using the Rich Audio Demo component in your React Native applications.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Advanced Configuration](#advanced-configuration)
4. [Custom Integration](#custom-integration)
5. [Platform-Specific Considerations](#platform-specific-considerations)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

## Installation & Setup

### Step 1: Install the Package

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

### Step 2: Platform Configuration

#### iOS Setup (Required)

Add the microphone usage description to your `ios/YourApp/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Other keys... -->
    
    <!-- REQUIRED: Microphone permission description -->
    <key>NSMicrophoneUsageDescription</key>
    <string>This app needs microphone access to analyze audio in real-time and provide visual feedback</string>
    
    <!-- Optional: More descriptive message -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Enable microphone access to see real-time audio visualization with spectrum analysis and level meters. Your audio is processed locally and never transmitted.</string>
</dict>
</plist>
```

**⚠️ Critical**: Without this entry, your app will crash when requesting microphone permission on iOS.

#### Android Setup (Required)

Add the microphone permission to your `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourapp">
    
    <!-- REQUIRED: Microphone permission -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Optional: Declare microphone as required feature -->
    <uses-feature 
        android:name="android.hardware.microphone" 
        android:required="true" />
    
    <application>
        <!-- Your app configuration -->
    </application>
</manifest>
```

**Note**: On Android 6.0+ (API level 23+), this permission requires runtime request, which the RichAudioDemo component handles automatically.

### Step 3: Native Module Linking

For React Native 0.60+, autolinking handles this automatically. For older versions:

```bash
npx react-native link react-native-realtime-audio-analysis
```

If autolinking fails, refer to the manual linking guide in the main documentation.

## Basic Usage

### Simple Integration

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function AudioVisualizerScreen() {
  return (
    <View style={styles.container}>
      <RichAudioDemo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Auto-Start Configuration

```typescript
import React from 'react';
import { View } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function AutoStartAudioScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <RichAudioDemo
        autoStart={true}  // Start analysis immediately after permission granted
        barCount={32}     // 32 frequency bars
      />
    </View>
  );
}
```

## Advanced Configuration

### Full Configuration Example

```typescript
import React, { useCallback, useState } from 'react';
import { View, Alert, Text, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function AdvancedAudioScreen() {
  const [errorCount, setErrorCount] = useState(0);

  const handleError = useCallback((error: Error) => {
    console.error('Audio analysis error:', error);
    setErrorCount(prev => prev + 1);
    
    // Show user-friendly error messages
    if (error.message.includes('permission')) {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use audio visualization.',
        [{ text: 'OK' }]
      );
    } else if (error.message.includes('not found')) {
      Alert.alert(
        'Audio Module Error',
        'The audio analysis module is not properly installed. Please restart the app.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Audio Error', error.message);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Audio Visualizer</Text>
      
      <RichAudioDemo
        autoStart={false}        // Manual start control
        showDebug={true}         // Show debug information
        barCount={64}            // High-resolution spectrum (64 bars)
        onError={handleError}    // Custom error handling
      />
      
      {errorCount > 0 && (
        <Text style={styles.errorCount}>
          Errors encountered: {errorCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorCount: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 10,
  },
});
```

## Custom Integration

### Using Individual Components

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  useRealtimeAudioLevels,
  SpectrumVisualizer,
  LevelMeter 
} from 'react-native-realtime-audio-analysis';

export default function CustomAudioScreen() {
  const {
    isAnalyzing,
    permissionStatus,
    frequencyData,
    rms,
    peak,
    rmsSmoothed,
    peakSmoothed,
    startAnalysis,
    stopAnalysis,
    requestPermission,
    error,
    sampleRate,
    fftSize
  } = useRealtimeAudioLevels();

  const [useSmoothed, setUseSmoothed] = useState(true);

  const handleToggleAnalysis = async () => {
    if (isAnalyzing) {
      await stopAnalysis();
    } else {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      await startAnalysis({
        fftSize: 2048,
        smoothing: 0.8
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Audio Integration</Text>
      
      {/* Status Information */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Permission: {permissionStatus}
        </Text>
        <Text style={styles.statusText}>
          Status: {isAnalyzing ? 'Analyzing' : 'Stopped'}
        </Text>
        <Text style={styles.statusText}>
          Sample Rate: {sampleRate}Hz
        </Text>
        <Text style={styles.statusText}>
          FFT Size: {fftSize}
        </Text>
      </View>

      {/* Custom Spectrum Visualizer */}
      <View style={styles.visualizerContainer}>
        <SpectrumVisualizer 
          frequencyData={frequencyData}
          barCount={48}
          style={styles.spectrum}
        />
      </View>

      {/* Custom Level Meters */}
      <View style={styles.metersContainer}>
        <View style={styles.meterColumn}>
          <Text style={styles.meterLabel}>Raw</Text>
          <LevelMeter 
            rms={rms}
            peak={peak}
            style={styles.meter}
          />
        </View>
        <View style={styles.meterColumn}>
          <Text style={styles.meterLabel}>Smoothed</Text>
          <LevelMeter 
            rms={rmsSmoothed}
            peak={peakSmoothed}
            style={styles.meter}
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.button, isAnalyzing && styles.buttonActive]}
          onPress={handleToggleAnalysis}
        >
          <Text style={styles.buttonText}>
            {isAnalyzing ? 'Stop' : 'Start'} Analysis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, useSmoothed && styles.buttonActive]}
          onPress={() => setUseSmoothed(!useSmoothed)}
        >
          <Text style={styles.buttonText}>
            {useSmoothed ? 'Raw' : 'Smoothed'} Values
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
  },
  visualizerContainer: {
    height: 200,
    marginBottom: 20,
  },
  spectrum: {
    flex: 1,
  },
  metersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  meterColumn: {
    alignItems: 'center',
  },
  meterLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  meter: {
    width: 100,
    height: 100,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ff3333',
    padding: 15,
    borderRadius: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
```

## Platform-Specific Considerations

### iOS Specific

#### Info.plist Configuration

The `NSMicrophoneUsageDescription` is mandatory. Here are some example descriptions:

```xml
<!-- Basic description -->
<key>NSMicrophoneUsageDescription</key>
<string>This app uses the microphone for audio visualization</string>

<!-- Detailed description -->
<key>NSMicrophoneUsageDescription</key>
<string>Enable microphone access to see real-time audio visualization with spectrum analysis and level meters. Your audio is processed locally and never transmitted or stored.</string>

<!-- App-specific description -->
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) needs microphone access to provide real-time audio feedback and visualization features.</string>
```

#### iOS Permission States

```typescript
// Handle iOS-specific permission states
const handleiOSPermissions = async () => {
  const { permissionStatus, requestPermission } = useRealtimeAudioLevels();
  
  switch (permissionStatus) {
    case 'undetermined':
      // First time - show explanation before requesting
      Alert.alert(
        'Microphone Access',
        'This app needs microphone access to provide audio visualization.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestPermission }
        ]
      );
      break;
      
    case 'denied':
      // User denied - show settings option
      Alert.alert(
        'Microphone Access Denied',
        'Please enable microphone access in Settings > Privacy > Microphone',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      break;
      
    case 'granted':
      // Permission granted - proceed with analysis
      break;
  }
};
```

### Android Specific

#### Manifest Configuration

```xml
<!-- Basic permission -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- With feature declaration -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-feature 
    android:name="android.hardware.microphone" 
    android:required="true" />

<!-- Optional: Declare as not required for devices without microphone -->
<uses-feature 
    android:name="android.hardware.microphone" 
    android:required="false" />
```

#### Android Permission Handling

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const handleAndroidPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'This app needs microphone access for audio visualization',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};
```

## Performance Optimization

### Optimizing Bar Count

```typescript
// Performance vs Quality trade-offs
const getOptimalBarCount = (devicePerformance: 'low' | 'medium' | 'high') => {
  switch (devicePerformance) {
    case 'low':
      return 16;    // Minimal bars for older devices
    case 'medium':
      return 32;    // Balanced performance
    case 'high':
      return 64;    // High-resolution visualization
    default:
      return 32;
  }
};

// Usage
<RichAudioDemo barCount={getOptimalBarCount('medium')} />
```

### Memory Management

```typescript
// The component automatically manages memory with Ring Buffer
// But you can optimize further:

const OptimizedAudioScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Stop analysis when screen is not visible
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        setIsVisible(false);
      } else if (nextAppState === 'active') {
        setIsVisible(true);
      }
    });
    
    return () => subscription?.remove();
  }, []);
  
  return (
    <View>
      {isVisible && (
        <RichAudioDemo autoStart={isVisible} />
      )}
    </View>
  );
};
```

### Animation Performance

```typescript
// Reduce animation complexity on lower-end devices
import { Platform } from 'react-native';

const isLowEndDevice = () => {
  // Simple heuristic - you might want more sophisticated detection
  return Platform.OS === 'android' && Platform.Version < 26;
};

<RichAudioDemo 
  barCount={isLowEndDevice() ? 16 : 32}
  showDebug={false}  // Debug panel can impact performance
/>
```

## Error Handling

### Comprehensive Error Handling

```typescript
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';

const ErrorHandlingExample = () => {
  const [lastError, setLastError] = useState<string | null>(null);
  
  const handleError = useCallback((error: Error) => {
    console.error('RichAudioDemo error:', error);
    setLastError(error.message);
    
    // Handle specific error types
    if (error.message.includes('permission')) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required for audio visualization. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    } else if (error.message.includes('not found') || error.message.includes('module')) {
      Alert.alert(
        'Module Error',
        'The audio analysis module is not properly installed. Please restart the app or reinstall.',
        [{ text: 'OK' }]
      );
    } else if (error.message.includes('analysis')) {
      Alert.alert(
        'Analysis Error',
        'Audio analysis failed. This might be due to device limitations or background restrictions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => setLastError(null) }
        ]
      );
    } else {
      Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
    }
  }, []);
  
  return (
    <RichAudioDemo 
      onError={handleError}
      // ... other props
    />
  );
};
```

### Error Recovery Strategies

```typescript
const ErrorRecoveryExample = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const handleErrorWithRecovery = useCallback(async (error: Error) => {
    console.error('Audio error:', error);
    
    if (retryCount < 3 && !isRecovering) {
      setIsRecovering(true);
      setRetryCount(prev => prev + 1);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset component by remounting
      setIsRecovering(false);
    } else {
      // Max retries reached - show permanent error
      Alert.alert(
        'Audio Unavailable',
        'Audio visualization is currently unavailable. Please check your device settings and try again later.',
        [{ text: 'OK' }]
      );
    }
  }, [retryCount, isRecovering]);
  
  if (isRecovering) {
    return <Text>Recovering audio analysis...</Text>;
  }
  
  return (
    <RichAudioDemo 
      key={retryCount}  // Force remount on retry
      onError={handleErrorWithRecovery}
    />
  );
};
```

## Testing

### Manual Testing Checklist

#### Permission Testing
- [ ] Fresh install shows permission prompt
- [ ] "Allow" grants permission and starts analysis
- [ ] "Deny" shows appropriate UI message
- [ ] Settings button opens device settings
- [ ] Permission changes are detected automatically

#### Functionality Testing
- [ ] Spectrum bars animate with audio input
- [ ] Level meters respond to volume changes
- [ ] Start/stop controls work correctly
- [ ] Debug panel shows accurate information
- [ ] Error messages are clear and actionable

#### Performance Testing
- [ ] Smooth animations (30+ FPS)
- [ ] No memory leaks during extended use
- [ ] Proper cleanup on component unmount
- [ ] Background/foreground transitions work
- [ ] Multiple start/stop cycles work correctly

### Automated Testing

```typescript
// Example test setup
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RichAudioDemo } from '../RichAudioDemo';

describe('RichAudioDemo', () => {
  it('should handle permission grant flow', async () => {
    const onError = jest.fn();
    const { getByText } = render(
      <RichAudioDemo onError={onError} />
    );
    
    // Mock permission granted
    // ... test implementation
    
    await waitFor(() => {
      expect(getByText('Start Analysis')).toBeTruthy();
    });
  });
  
  it('should display error for permission denial', async () => {
    const onError = jest.fn();
    const { getByText } = render(
      <RichAudioDemo onError={onError} />
    );
    
    // Mock permission denied
    // ... test implementation
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
```

This usage guide provides comprehensive examples and best practices for integrating the Rich Audio Demo component into React Native applications, covering all the essential aspects from basic setup to advanced customization and error handling.
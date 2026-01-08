# Audio Permission and Configuration Fix

## The Issue

`AudioRecord initialization failed` error occurs because:
1. Missing runtime audio permission (Android 6.0+)
2. Audio source conflicts
3. Invalid audio configuration

## Solution

### Step 1: Add Runtime Permission Request

Create this file in your React Native app: `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/src/screens/PermissionHelper.js`

```javascript
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestAudioPermission = async () => {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions differently
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Audio Recording Permission',
        message: 'This app needs access to your microphone to analyze audio.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Audio permission granted');
      return true;
    } else {
      console.log('Audio permission denied');
      Alert.alert(
        'Permission Required',
        'Audio recording permission is required for this feature to work.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

export const checkAudioPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted;
  } catch (err) {
    console.warn('Permission check error:', err);
    return false;
  }
};
```

### Step 2: Update RealtimeAudioAnalyzer.js with Better Error Handling

Update your `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/src/screens/RealtimeAudioAnalyzer.js`:

```javascript
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Debug: First, let's see what native modules are actually available
console.log('🔍 All available NativeModules:');
console.log(Object.keys(NativeModules));

console.log('\n🔍 Audio-related modules:');
const audioModules = Object.keys(NativeModules).filter(key => 
  key.toLowerCase().includes('audio') || 
  key.toLowerCase().includes('realtime') ||
  key.toLowerCase().includes('analyzer')
);
console.log('Audio modules found:', audioModules);

// Try to find our module with different possible names
const possibleNames = [
  'RealtimeAudioAnalysis',
  'RealtimeAudioAnalyzer', 
  'RealtimeAudioAnalysisModule',
  'RealtimeAudioAnalyzerModule',
  'AudioAnalysis',
  'AudioAnalyzer'
];

console.log('\n🔍 Checking possible module names:');
let foundModule = null;
let foundName = null;

possibleNames.forEach(name => {
  const module = NativeModules[name];
  if (module) {
    console.log(`✅ Found: ${name}`);
    console.log(`   Methods: ${Object.keys(module)}`);
    if (!foundModule) {
      foundModule = module;
      foundName = name;
    }
  } else {
    console.log(`❌ Not found: ${name}`);
  }
});

const LINKING_ERROR =
  "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '\nAvailable modules: ' + Object.keys(NativeModules).join(', ');

// Get the native module - try all possible names
const RealtimeAudioAnalysisModule = foundModule;

if (!RealtimeAudioAnalysisModule) {
  console.error('\n❌ Module not found with any name!');
  console.error('Available modules:', Object.keys(NativeModules));
  throw new Error(LINKING_ERROR);
} else {
  console.log(`\n✅ Module found as: ${foundName}`);
  console.log('Module methods:', Object.keys(RealtimeAudioAnalysisModule));
}

// Create event emitter
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

const RealtimeAudioAnalyzer = {
  // Core methods with better error handling
  async startAnalysis(config = {}) {
    console.log('Calling startAnalysis with config:', config);
    try {
      const result = await RealtimeAudioAnalysisModule.startAnalysis(config);
      console.log('✅ startAnalysis successful');
      return result;
    } catch (error) {
      console.error('❌ startAnalysis failed:', error.message);
      
      // Provide specific error messages
      if (error.message.includes('Permission denied')) {
        throw new Error('Microphone permission denied. Please grant audio recording permission.');
      } else if (error.message.includes('AudioRecord initialization failed')) {
        throw new Error('Audio initialization failed. Please ensure no other app is using the microphone and try again.');
      } else {
        throw error;
      }
    }
  },

  async stopAnalysis() {
    console.log('Calling stopAnalysis');
    try {
      const result = await RealtimeAudioAnalysisModule.stopAnalysis();
      console.log('✅ stopAnalysis successful');
      return result;
    } catch (error) {
      console.error('❌ stopAnalysis failed:', error.message);
      throw error;
    }
  },

  async isAnalyzing() {
    try {
      return await RealtimeAudioAnalysisModule.isAnalyzing();
    } catch (error) {
      console.error('❌ isAnalyzing failed:', error.message);
      return false;
    }
  },

  async getAnalysisConfig() {
    try {
      return await RealtimeAudioAnalysisModule.getAnalysisConfig();
    } catch (error) {
      console.error('❌ getAnalysisConfig failed:', error.message);
      throw error;
    }
  },

  // Event emitter methods
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;
```

### Step 3: Update SimpleModuleTest.js with Permission Request

Update your `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/src/screens/SimpleModuleTest.js`:

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import RealtimeAudioAnalyzer from './RealtimeAudioAnalyzer';
import { requestAudioPermission, checkAudioPermission } from './PermissionHelper';

const SimpleModuleTest = () => {
  const [moduleStatus, setModuleStatus] = useState('Testing...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Checking...');

  const checkPermissions = async () => {
    try {
      const hasPermission = await checkAudioPermission();
      if (hasPermission) {
        setPermissionStatus('✅ Audio permission granted');
        return true;
      } else {
        setPermissionStatus('❌ Audio permission denied');
        return false;
      }
    } catch (error) {
      setPermissionStatus('❌ Permission check failed');
      return false;
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await requestAudioPermission();
      if (granted) {
        setPermissionStatus('✅ Audio permission granted');
        return true;
      } else {
        setPermissionStatus('❌ Audio permission denied');
        return false;
      }
    } catch (error) {
      setPermissionStatus('❌ Permission request failed');
      return false;
    }
  };

  const testModule = async () => {
    try {
      setModuleStatus('Checking permissions...');
      
      // First check if we have permission
      let hasPermission = await checkPermissions();
      
      // If not, request it
      if (!hasPermission) {
        hasPermission = await requestPermissions();
      }
      
      if (!hasPermission) {
        setModuleStatus('❌ Audio permission required');
        return;
      }

      setModuleStatus('Testing module...');

      if (!RealtimeAudioAnalyzer) {
        setModuleStatus('❌ Module not found');
        return;
      }

      // Check methods
      const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing'];
      const availableMethods = methods.filter(method => 
        typeof RealtimeAudioAnalyzer[method] === 'function'
      );

      if (availableMethods.length === methods.length) {
        setModuleStatus('✅ Module working! Starting analysis...');
        
        // Try to start analysis with safe config
        await RealtimeAudioAnalyzer.startAnalysis({
          fftSize: 1024,
          sampleRate: 44100
        });
        
        setIsAnalyzing(true);
        setModuleStatus('✅ Analysis started successfully!');
        Alert.alert('Success!', 'Module is working correctly');
        
        // Stop after 3 seconds
        setTimeout(async () => {
          try {
            await RealtimeAudioAnalyzer.stopAnalysis();
            setIsAnalyzing(false);
            setModuleStatus('✅ Analysis stopped successfully');
          } catch (e) {
            console.log('Stop error:', e);
            setModuleStatus('⚠️ Stop error: ' + e.message);
          }
        }, 3000);
        
      } else {
        const missingMethods = methods.filter(m => !availableMethods.includes(m));
        setModuleStatus(`❌ Missing methods: ${missingMethods.join(', ')}`);
      }
      
    } catch (error) {
      setModuleStatus(`❌ Error: ${error.message}`);
      console.error('Module test error:', error);
      
      // Show user-friendly error messages
      if (error.message.includes('permission')) {
        Alert.alert('Permission Error', 'Please grant microphone permission and try again.');
      } else if (error.message.includes('AudioRecord')) {
        Alert.alert('Audio Error', 'Could not access microphone. Please ensure no other app is using it and try again.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  React.useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Module Test</Text>
      <Text style={styles.status}>{permissionStatus}</Text>
      <Text style={styles.status}>{moduleStatus}</Text>
      <Text style={styles.status}>
        Analysis: {isAnalyzing ? '🎤 Running' : '⏹ Stopped'}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={testModule}>
        <Text style={styles.buttonText}>Test Module</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
        <Text style={styles.buttonText}>Request Permission</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SimpleModuleTest;
```

### Step 4: Test the Fix

1. **Create the PermissionHelper.js file**
2. **Update both RealtimeAudioAnalyzer.js and SimpleModuleTest.js**
3. **Rebuild and test:**
   ```bash
   cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp
   npx react-native run-android
   ```

### Expected Behavior

1. App will check for audio permission on load
2. If permission is missing, it will request it when you tap "Test Module"
3. Once permission is granted, the audio analysis should start successfully
4. You should see "✅ Analysis started successfully!" instead of the AudioRecord error

This should resolve the `AudioRecord initialization failed` error by properly handling the runtime permission requirement.
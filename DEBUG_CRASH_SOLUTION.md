# Debug App Crash Solution

## The Issue
App crashes when pressing "Test Module" button, which means there's likely a native code issue when calling `startAnalysis()`.

## Step 1: Check Android Logs

First, let's see what's causing the crash. Run this command to see the crash logs:

```bash
# In a new terminal, run this to see Android logs:
adb logcat | grep -E "(FATAL|AndroidRuntime|RealtimeAudio|AudioEngine)"
```

Then press the "Test Module" button and look for crash details.

## Step 2: Create Safer Test Version

Let's create a safer version that won't crash. Create this file to replace your current SimpleModuleTest.js:

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import RealtimeAudioAnalyzer from './RealtimeAudioAnalyzer';
import { requestAudioPermission, checkAudioPermission } from './PermissionHelper';

const SimpleModuleTest = () => {
  const [moduleStatus, setModuleStatus] = useState('Ready to test...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Checking...');
  const [debugInfo, setDebugInfo] = useState('');

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
      setPermissionStatus('❌ Permission check failed: ' + error.message);
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
      setPermissionStatus('❌ Permission request failed: ' + error.message);
      return false;
    }
  };

  const testModuleBasic = async () => {
    try {
      setModuleStatus('Step 1: Checking module availability...');
      
      if (!RealtimeAudioAnalyzer) {
        setModuleStatus('❌ Module not found');
        return;
      }

      setModuleStatus('Step 2: Checking methods...');
      
      // Check methods
      const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig'];
      const availableMethods = methods.filter(method => 
        typeof RealtimeAudioAnalyzer[method] === 'function'
      );

      setDebugInfo(`Available methods: ${availableMethods.join(', ')}`);

      if (availableMethods.length < 3) {
        const missingMethods = methods.filter(m => !availableMethods.includes(m));
        setModuleStatus(`❌ Missing methods: ${missingMethods.join(', ')}`);
        return;
      }

      setModuleStatus('Step 3: Testing getAnalysisConfig...');
      
      // Test a safe method first
      try {
        const config = await RealtimeAudioAnalyzer.getAnalysisConfig();
        setDebugInfo(`Config: ${JSON.stringify(config)}`);
        setModuleStatus('✅ getAnalysisConfig works!');
      } catch (configError) {
        setModuleStatus('❌ getAnalysisConfig failed: ' + configError.message);
        setDebugInfo('Config error: ' + configError.message);
        return;
      }

      setModuleStatus('✅ Basic module test passed! Ready for audio test.');
      
    } catch (error) {
      setModuleStatus(`❌ Basic test error: ${error.message}`);
      setDebugInfo('Error details: ' + error.stack);
      console.error('Basic module test error:', error);
    }
  };

  const testAudioAnalysis = async () => {
    try {
      setModuleStatus('Step 1: Checking permissions...');
      
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

      setModuleStatus('Step 2: Testing isAnalyzing...');
      
      // Test isAnalyzing first (safe method)
      try {
        const analyzing = await RealtimeAudioAnalyzer.isAnalyzing();
        setDebugInfo(`Currently analyzing: ${analyzing}`);
      } catch (isAnalyzingError) {
        setModuleStatus('❌ isAnalyzing failed: ' + isAnalyzingError.message);
        return;
      }

      setModuleStatus('Step 3: Starting audio analysis...');
      
      // Try to start analysis with minimal config
      try {
        await RealtimeAudioAnalyzer.startAnalysis({
          fftSize: 512,  // Smaller size
          sampleRate: 22050  // Lower sample rate
        });
        
        setIsAnalyzing(true);
        setModuleStatus('✅ Analysis started successfully!');
        setDebugInfo('Audio analysis is running');
        
        Alert.alert('Success!', 'Audio analysis started successfully!');
        
        // Stop after 2 seconds
        setTimeout(async () => {
          try {
            await RealtimeAudioAnalyzer.stopAnalysis();
            setIsAnalyzing(false);
            setModuleStatus('✅ Analysis stopped successfully');
            setDebugInfo('Audio analysis stopped');
          } catch (stopError) {
            console.log('Stop error:', stopError);
            setModuleStatus('⚠️ Stop error: ' + stopError.message);
            setDebugInfo('Stop error: ' + stopError.message);
          }
        }, 2000);
        
      } catch (startError) {
        setModuleStatus('❌ Start analysis failed: ' + startError.message);
        setDebugInfo('Start error: ' + startError.message);
        
        // Show user-friendly error messages
        if (startError.message.includes('permission')) {
          Alert.alert('Permission Error', 'Please grant microphone permission and try again.');
        } else if (startError.message.includes('AudioRecord')) {
          Alert.alert('Audio Error', 'Could not access microphone. Please ensure no other app is using it and try again.');
        } else {
          Alert.alert('Error', startError.message);
        }
      }
      
    } catch (error) {
      setModuleStatus(`❌ Audio test error: ${error.message}`);
      setDebugInfo('Audio test error: ' + error.stack);
      console.error('Audio test error:', error);
    }
  };

  React.useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Module Test (Safe Version)</Text>
      <Text style={styles.status}>{permissionStatus}</Text>
      <Text style={styles.status}>{moduleStatus}</Text>
      <Text style={styles.debugText}>{debugInfo}</Text>
      <Text style={styles.status}>
        Analysis: {isAnalyzing ? '🎤 Running' : '⏹ Stopped'}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={testModuleBasic}>
        <Text style={styles.buttonText}>1. Test Module Basic</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testAudioAnalysis}>
        <Text style={styles.buttonText}>2. Test Audio Analysis</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 200,
  },
  permissionButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SimpleModuleTest;
```

## Step 3: Test Safely

1. **Replace your SimpleModuleTest.js** with the safer version above
2. **Rebuild the app**
3. **First press "1. Test Module Basic"** - this tests the module without calling native audio code
4. **If that works, then press "2. Test Audio Analysis"** - this tests the actual audio functionality

## Step 4: Check for Common Issues

The crash is likely caused by one of these:

### A. Native Library Loading Issue
The C++ library might not be loading properly. Check if you see this in the logs:
```
Failed to load C++ library
```

### B. AudioRecord Configuration Issue
The audio parameters might be invalid for your device.

### C. Permission Issue
Even with runtime permissions, there might be a deeper permission issue.

## Step 5: Get Crash Details

Run the adb logcat command and tell me what error you see when the app crashes. This will help identify the exact cause.

The safer test version will help us isolate whether it's:
- A basic module loading issue
- A native audio initialization issue
- A permission issue
- A C++ library issue

Try this and let me know what happens with each test button!
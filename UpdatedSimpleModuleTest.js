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
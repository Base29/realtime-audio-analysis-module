import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';

// Import the module
let RealtimeAudioAnalyzer;
try {
  RealtimeAudioAnalyzer = require('react-native-realtime-audio-analysis').default;
  console.log('✅ Module imported successfully');
} catch (error) {
  console.error('❌ Module import failed:', error);
}

const TestAudioModule = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);
  const [moduleStatus, setModuleStatus] = useState('checking...');

  useEffect(() => {
    checkModuleStatus();
  }, []);

  const checkModuleStatus = () => {
    if (!RealtimeAudioAnalyzer) {
      setModuleStatus('❌ Module not available');
      setError('Module not found. Check linking.');
      return;
    }

    // Check available methods
    const requiredMethods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'addListener'];
    const availableMethods = requiredMethods.filter(method => 
      typeof RealtimeAudioAnalyzer[method] === 'function'
    );

    if (availableMethods.length === requiredMethods.length) {
      setModuleStatus('✅ Module ready');
      
      // Set up event listener
      const subscription = RealtimeAudioAnalyzer.addListener('AudioAnalysisData', (data) => {
        console.log('📊 Audio data received:', {
          volume: data.volume,
          rms: data.rms,
          peak: data.peak,
          frequencyDataLength: data.frequencyData?.length,
          fftLength: data.fft?.length
        });
        setVolume(data.volume || data.rms || 0);
      });

      return () => {
        subscription.remove();
      };
    } else {
      setModuleStatus(`❌ Missing methods: ${requiredMethods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      setError('Module methods not available');
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for audio analysis',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startAnalysis = async () => {
    try {
      setError(null);

      if (!RealtimeAudioAnalyzer) {
        throw new Error('RealtimeAudioAnalyzer module not found. Check linking.');
      }

      console.log('🎤 Requesting microphone permission...');
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      console.log('🚀 Starting audio analysis...');
      await RealtimeAudioAnalyzer.startAnalysis({
        fftSize: 1024,
        sampleRate: 44100,
      });

      setIsAnalyzing(true);
      console.log('✅ Audio analysis started successfully');
    } catch (err) {
      console.error('❌ Failed to start analysis:', err);
      setError(err.message);
      Alert.alert('Error', `Failed to start analysis: ${err.message}`);
    }
  };

  const stopAnalysis = async () => {
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('RealtimeAudioAnalyzer module not found');
      }

      console.log('⏹️ Stopping audio analysis...');
      await RealtimeAudioAnalyzer.stopAnalysis();
      setIsAnalyzing(false);
      setVolume(0);
      console.log('✅ Audio analysis stopped');
    } catch (err) {
      console.error('❌ Failed to stop analysis:', err);
      setError(err.message);
      Alert.alert('Error', `Failed to stop analysis: ${err.message}`);
    }
  };

  const testModule = () => {
    if (!RealtimeAudioAnalyzer) {
      Alert.alert('Module Error', 'RealtimeAudioAnalyzer is not available. Check linking.');
      return;
    }

    const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig', 'addListener'];
    const availableMethods = methods.filter(method => 
      typeof RealtimeAudioAnalyzer[method] === 'function'
    );

    Alert.alert(
      'Module Status',
      `Module is available!\n\nMethods found: ${availableMethods.join(', ')}\n\nMissing: ${methods.filter(m => !availableMethods.includes(m)).join(', ') || 'None'}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Module Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Module Status: {moduleStatus}</Text>
        <Text style={styles.statusText}>
          Analysis: {isAnalyzing ? '🎤 Recording' : '⏹ Stopped'}
        </Text>
        <Text style={styles.statusText}>
          Volume: {(volume * 100).toFixed(1)}%
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testModule}
        >
          <Text style={styles.buttonText}>Test Module</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isAnalyzing ? styles.stopButton : styles.startButton,
            !RealtimeAudioAnalyzer && styles.disabledButton
          ]}
          onPress={isAnalyzing ? stopAnalysis : startAnalysis}
          disabled={!RealtimeAudioAnalyzer}
        >
          <Text style={styles.buttonText}>
            {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.volumeBar}>
        <View
          style={[
            styles.volumeFill,
            {
              width: `${volume * 100}%`,
              backgroundColor: volume > 0.7 ? '#ff4444' : volume > 0.4 ? '#ffaa00' : '#44ff44'
            }
          ]}
        />
      </View>

      <Text style={styles.instructions}>
        1. Tap "Test Module" to verify the module is available{'\n'}
        2. Tap "Start Analysis" to begin audio capture{'\n'}
        3. Speak or make noise to see the volume bar{'\n'}
        4. Check the console for detailed logs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#2196f3',
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  volumeBar: {
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 10,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TestAudioModule;
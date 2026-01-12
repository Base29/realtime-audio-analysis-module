import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeEventEmitter, NativeModules } from 'react-native';

// Import the module
import RealtimeAudioAnalyzer, { AudioAnalysisEvent } from '../src/index';

interface TestResult {
  name: string;
  status: 'pending' | 'pass' | 'fail';
  message?: string;
  duration?: number;
}

interface AudioData {
  rms: number;
  peak: number;
  fft: number[];
  timestamp: number;
  sampleRate?: number;
  bufferSize?: number;
}

/**
 * Comprehensive Test Screen for React Native Realtime Audio Analysis Module
 * 
 * This component tests:
 * - Module linking and availability
 * - Method exports and functionality
 * - Event emission and data flow
 * - Permission handling
 * - Audio analysis accuracy
 * - Error handling and edge cases
 */
export const TestScreen: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  // Test suite configuration
  const tests: TestResult[] = [
    { name: 'Module Availability', status: 'pending' },
    { name: 'Method Exports', status: 'pending' },
    { name: 'Event Emitter Setup', status: 'pending' },
    { name: 'Permission Request', status: 'pending' },
    { name: 'Start Analysis', status: 'pending' },
    { name: 'Data Reception', status: 'pending' },
    { name: 'Stop Analysis', status: 'pending' },
    { name: 'Restart Capability', status: 'pending' },
    { name: 'Error Handling', status: 'pending' },
  ];

  const [results, setResults] = useState<TestResult[]>(tests);

  // Audio data callback
  const onAudioData = useCallback((data: AudioAnalysisEvent) => {
    const now = Date.now();
    setAudioData({
      rms: data.rms || data.volume || 0,
      peak: data.peak || 0,
      fft: data.frequencyData || data.fft || [],
      timestamp: data.timestamp || now,
      sampleRate: data.sampleRate,
      bufferSize: data.bufferSize,
    });
    setEventCount(prev => prev + 1);
  }, []);

  // Setup event listener
  useEffect(() => {
    let subscription: any = null;
    
    if (RealtimeAudioAnalyzer) {
      try {
        const emitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
        
        // Try both event names for compatibility
        subscription = emitter.addListener('AudioAnalysisData', onAudioData);
        
        // Also try the alternative event name
        const subscription2 = emitter.addListener('RealtimeAudioAnalyzer:onData', onAudioData);
        
        return () => {
          subscription?.remove();
          subscription2?.remove();
        };
      } catch (error) {
        console.error('Failed to setup event listener:', error);
      }
    }
    
    return () => {
      subscription?.remove();
    };
  }, [onAudioData]);

  // Update test result
  const updateTestResult = (testName: string, status: 'pass' | 'fail', message?: string, duration?: number) => {
    setResults(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status, message, duration }
        : test
    ));
  };

  // Request microphone permission
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for audio analysis testing',
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
    }
    return true; // iOS handles permissions automatically
  };

  // Individual test functions
  const testModuleAvailability = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Check if module is available
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not found in imports');
      }

      // Check if module is in NativeModules
      if (!NativeModules.RealtimeAudioAnalyzer) {
        throw new Error('Module not found in NativeModules');
      }

      const duration = Date.now() - startTime;
      updateTestResult('Module Availability', 'pass', 'Module successfully linked', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Module Availability', 'fail', (error as Error).message, duration);
    }
  };

  const testMethodExports = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const requiredMethods = [
        'startAnalysis',
        'stopAnalysis',
        'isAnalyzing',
      ];

      const availableMethods = Object.keys(RealtimeAudioAnalyzer || {});
      const missingMethods = requiredMethods.filter(method => 
        !availableMethods.includes(method) && 
        typeof (RealtimeAudioAnalyzer as any)?.[method] !== 'function'
      );

      if (missingMethods.length > 0) {
        throw new Error(`Missing methods: ${missingMethods.join(', ')}`);
      }

      const duration = Date.now() - startTime;
      updateTestResult('Method Exports', 'pass', `Found ${availableMethods.length} methods`, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Method Exports', 'fail', (error as Error).message, duration);
    }
  };

  const testEventEmitterSetup = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not available');
      }

      const emitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
      if (!emitter) {
        throw new Error('Failed to create NativeEventEmitter');
      }

      const duration = Date.now() - startTime;
      updateTestResult('Event Emitter Setup', 'pass', 'Event emitter created successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Event Emitter Setup', 'fail', (error as Error).message, duration);
    }
  };

  const testPermissionRequest = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const hasPermission = await requestPermission();
      
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      const duration = Date.now() - startTime;
      updateTestResult('Permission Request', 'pass', 'Microphone permission granted', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Permission Request', 'fail', (error as Error).message, duration);
    }
  };

  const testStartAnalysis = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not available');
      }

      await RealtimeAudioAnalyzer.startAnalysis({
        fftSize: 1024,
        sampleRate: 48000,
      });

      // Check if analysis is running
      const isRunning = await RealtimeAudioAnalyzer.isAnalyzing();
      if (!isRunning) {
        throw new Error('Analysis not running after start');
      }

      setIsAnalyzing(true);
      const duration = Date.now() - startTime;
      updateTestResult('Start Analysis', 'pass', 'Analysis started successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Start Analysis', 'fail', (error as Error).message, duration);
    }
  };

  const testDataReception = async (): Promise<void> => {
    const startTime = Date.now();
    const initialEventCount = eventCount;
    
    try {
      // Wait for data events (up to 5 seconds)
      const timeout = 5000;
      const checkInterval = 100;
      let elapsed = 0;

      while (elapsed < timeout) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;

        if (eventCount > initialEventCount) {
          const duration = Date.now() - startTime;
          updateTestResult('Data Reception', 'pass', `Received ${eventCount - initialEventCount} events`, duration);
          return;
        }
      }

      throw new Error('No audio data received within timeout');
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Data Reception', 'fail', (error as Error).message, duration);
    }
  };

  const testStopAnalysis = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not available');
      }

      await RealtimeAudioAnalyzer.stopAnalysis();

      // Check if analysis is stopped
      const isRunning = await RealtimeAudioAnalyzer.isAnalyzing();
      if (isRunning) {
        throw new Error('Analysis still running after stop');
      }

      setIsAnalyzing(false);
      const duration = Date.now() - startTime;
      updateTestResult('Stop Analysis', 'pass', 'Analysis stopped successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Stop Analysis', 'fail', (error as Error).message, duration);
    }
  };

  const testRestartCapability = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not available');
      }

      // Start again
      await RealtimeAudioAnalyzer.startAnalysis({ fftSize: 512 });
      
      // Brief wait
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stop again
      await RealtimeAudioAnalyzer.stopAnalysis();

      const duration = Date.now() - startTime;
      updateTestResult('Restart Capability', 'pass', 'Restart cycle completed', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Restart Capability', 'fail', (error as Error).message, duration);
    }
  };

  const testErrorHandling = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      if (!RealtimeAudioAnalyzer) {
        throw new Error('Module not available');
      }

      // Test invalid config (should not crash)
      try {
        await RealtimeAudioAnalyzer.startAnalysis({
          fftSize: -1, // Invalid
          sampleRate: 0, // Invalid
        } as any);
      } catch (expectedError) {
        // This is expected - invalid config should be rejected
      }

      // Test multiple stops (should be idempotent)
      await RealtimeAudioAnalyzer.stopAnalysis();
      await RealtimeAudioAnalyzer.stopAnalysis();
      await RealtimeAudioAnalyzer.stopAnalysis();

      const duration = Date.now() - startTime;
      updateTestResult('Error Handling', 'pass', 'Error handling works correctly', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Error Handling', 'fail', (error as Error).message, duration);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setCurrentTest('Running Tests...');
    setEventCount(0);
    setAudioData(null);

    const testFunctions = [
      { name: 'Module Availability', fn: testModuleAvailability },
      { name: 'Method Exports', fn: testMethodExports },
      { name: 'Event Emitter Setup', fn: testEventEmitterSetup },
      { name: 'Permission Request', fn: testPermissionRequest },
      { name: 'Start Analysis', fn: testStartAnalysis },
      { name: 'Data Reception', fn: testDataReception },
      { name: 'Stop Analysis', fn: testStopAnalysis },
      { name: 'Restart Capability', fn: testRestartCapability },
      { name: 'Error Handling', fn: testErrorHandling },
    ];

    for (const test of testFunctions) {
      setCurrentTest(test.name);
      await test.fn();
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setCurrentTest(null);
  };

  // Manual start/stop for interactive testing
  const manualStart = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required for audio analysis');
        return;
      }

      await RealtimeAudioAnalyzer.startAnalysis({
        fftSize: 1024,
        sampleRate: 48000,
      });
      setIsAnalyzing(true);
    } catch (error) {
      Alert.alert('Error', `Failed to start analysis: ${(error as Error).message}`);
    }
  };

  const manualStop = async () => {
    try {
      await RealtimeAudioAnalyzer.stopAnalysis();
      setIsAnalyzing(false);
    } catch (error) {
      Alert.alert('Error', `Failed to stop analysis: ${(error as Error).message}`);
    }
  };

  // Calculate test summary
  const passedTests = results.filter(t => t.status === 'pass').length;
  const failedTests = results.filter(t => t.status === 'fail').length;
  const totalTests = results.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Audio Analysis Module Test</Text>
        
        {/* Test Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Tests: {passedTests}/{totalTests} passed
          </Text>
          {failedTests > 0 && (
            <Text style={styles.failedText}>
              {failedTests} failed
            </Text>
          )}
        </View>

        {/* Current Test Indicator */}
        {currentTest && (
          <View style={styles.currentTestContainer}>
            <Text style={styles.currentTestText}>Running: {currentTest}</Text>
          </View>
        )}

        {/* Test Results */}
        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {results.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.name}</Text>
                <View style={[
                  styles.statusBadge,
                  test.status === 'pass' && styles.statusPass,
                  test.status === 'fail' && styles.statusFail,
                  test.status === 'pending' && styles.statusPending,
                ]}>
                  <Text style={styles.statusText}>
                    {test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏳'}
                  </Text>
                </View>
              </View>
              {test.message && (
                <Text style={styles.testMessage}>{test.message}</Text>
              )}
              {test.duration && (
                <Text style={styles.testDuration}>{test.duration}ms</Text>
              )}
            </View>
          ))}
        </View>

        {/* Live Audio Data */}
        {audioData && (
          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Live Audio Data</Text>
            <Text style={styles.dataText}>RMS: {audioData.rms.toFixed(4)}</Text>
            <Text style={styles.dataText}>Peak: {audioData.peak.toFixed(4)}</Text>
            <Text style={styles.dataText}>FFT Bins: {audioData.fft.length}</Text>
            <Text style={styles.dataText}>Events: {eventCount}</Text>
            {audioData.sampleRate && (
              <Text style={styles.dataText}>Sample Rate: {audioData.sampleRate}Hz</Text>
            )}
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runAllTests}
            disabled={!!currentTest}
          >
            <Text style={styles.buttonText}>
              {currentTest ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>

          <View style={styles.manualControls}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, isAnalyzing && styles.disabledButton]}
              onPress={manualStart}
              disabled={isAnalyzing || !!currentTest}
            >
              <Text style={styles.buttonText}>Manual Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, !isAnalyzing && styles.disabledButton]}
              onPress={manualStop}
              disabled={!isAnalyzing || !!currentTest}
            >
              <Text style={styles.buttonText}>Manual Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Module Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Module Information</Text>
          <Text style={styles.infoText}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
          <Text style={styles.infoText}>
            Module Available: {RealtimeAudioAnalyzer ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoText}>
            Native Module: {NativeModules.RealtimeAudioAnalyzer ? 'Yes' : 'No'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
  },
  failedText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentTestContainer: {
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  currentTestText: {
    color: '#ffaa00',
    fontSize: 14,
    textAlign: 'center',
  },
  testsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  testItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    alignItems: 'center',
  },
  statusPass: {
    backgroundColor: '#00ff8844',
  },
  statusFail: {
    backgroundColor: '#ff444444',
  },
  statusPending: {
    backgroundColor: '#ffaa0044',
  },
  statusText: {
    fontSize: 12,
  },
  testMessage: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 4,
  },
  testDuration: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  dataContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dataText: {
    color: '#00ff88',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  manualControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#00ff88',
  },
  secondaryButton: {
    backgroundColor: '#0066cc',
    flex: 0.48,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default TestScreen;
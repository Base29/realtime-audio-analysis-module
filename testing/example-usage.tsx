import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeEventEmitter } from 'react-native';
import RealtimeAudioAnalyzer, { AudioAnalysisEvent } from '../src/index';

/**
 * Simple usage example for React Native Realtime Audio Analysis
 * 
 * This component demonstrates:
 * - Basic module import and usage
 * - Starting and stopping audio analysis
 * - Receiving real-time audio data
 * - Displaying RMS and peak values
 * - Simple error handling
 */
export const SimpleAudioExample: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rms, setRms] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Setup audio data listener
  useEffect(() => {
    if (!RealtimeAudioAnalyzer) return;

    const emitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = emitter.addListener('AudioAnalysisData', (data: AudioAnalysisEvent) => {
      setRms(data.rms || data.volume || 0);
      setPeak(data.peak || 0);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startAnalysis = async () => {
    try {
      setError(null);
      
      await RealtimeAudioAnalyzer.startAnalysis({
        fftSize: 1024,
        sampleRate: 48000,
      });
      
      setIsAnalyzing(true);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      Alert.alert('Error', `Failed to start analysis: ${message}`);
    }
  };

  const stopAnalysis = async () => {
    try {
      await RealtimeAudioAnalyzer.stopAnalysis();
      setIsAnalyzing(false);
      setRms(0);
      setPeak(0);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      Alert.alert('Error', `Failed to stop analysis: ${message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Analysis Example</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.dataContainer}>
        <Text style={styles.dataLabel}>RMS Level:</Text>
        <Text style={styles.dataValue}>{rms.toFixed(4)}</Text>
        
        <Text style={styles.dataLabel}>Peak Level:</Text>
        <Text style={styles.dataValue}>{peak.toFixed(4)}</Text>
      </View>

      <View style={styles.controls}>
        {!isAnalyzing ? (
          <TouchableOpacity style={styles.startButton} onPress={startAnalysis}>
            <Text style={styles.buttonText}>Start Analysis</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopAnalysis}>
            <Text style={styles.buttonText}>Stop Analysis</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.status}>
        Status: {isAnalyzing ? '🎤 Recording' : '⏹ Stopped'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  dataContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});

export default SimpleAudioExample;
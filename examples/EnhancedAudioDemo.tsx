import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { RichAudioDemo } from '../src/demo';

/**
 * Enhanced Audio Demo Example
 * 
 * This example showcases the enhanced RichAudioDemo component with:
 * - Real-time dB value display for RMS and Peak levels
 * - Session statistics (min/max/average values)
 * - Enhanced visual feedback with color-coded dB levels
 * - Frequency labels on the spectrum visualizer
 * - dB scale indicators
 * - Improved layout and visual hierarchy
 */
const EnhancedAudioDemo: React.FC = () => {
  const handleError = (error: Error) => {
    console.error('Audio Demo Error:', error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.demoContainer}>
        <RichAudioDemo
          autoStart={false}
          showDebug={false}
          barCount={32}
          onError={handleError}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  demoContainer: {
    flex: 1,
    padding: 16,
  },
});

export default EnhancedAudioDemo;
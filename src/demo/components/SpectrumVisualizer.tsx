import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Animated } from 'react-native';
import { SpectrumVisualizerProps } from '../types/interfaces';
import { RingBuffer } from '../utils/RingBuffer';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Spectrum Visualizer Component
 * 
 * Renders animated frequency spectrum bars with:
 * - Configurable bar count and color gradients
 * - Smooth animations using React Native Animated API
 * - Peak hold indicators with decay animation
 * - Performance optimizations with Ring Buffer for memory bounds
 * 
 * Requirements: 1.2, 3.1, 3.3, 3.6
 */
const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  frequencyData,
  barCount,
  isAnalyzing,
}) => {
  // Animated values for each bar height
  const barHeights = useRef<Animated.Value[]>([]);
  
  // Peak hold values and animated values
  const peakHoldValues = useRef<number[]>([]);
  const peakHoldAnimatedValues = useRef<Animated.Value[]>([]);
  const peakHoldDecayTimeouts = useRef<NodeJS.Timeout[]>([]);
  
  // Ring buffer for frequency history to prevent memory growth
  const frequencyHistoryRef = useRef<RingBuffer<number[]>>();
  
  // Performance optimization - track last update time for throttling
  const lastUpdateTimeRef = useRef(0);
  const updateThrottleMs = 16; // ~60 FPS
  
  // Initialize animated values and ring buffer
  useEffect(() => {
    // Initialize ring buffer with bounded memory (store last 10 frames for smoothing)
    frequencyHistoryRef.current = new RingBuffer<number[]>(10, []);
    
    // Initialize animated values for bars
    barHeights.current = Array.from({ length: barCount }, () => new Animated.Value(0));
    
    // Initialize peak hold values and animated values
    peakHoldValues.current = new Array(barCount).fill(0);
    peakHoldAnimatedValues.current = Array.from({ length: barCount }, () => new Animated.Value(0));
    peakHoldDecayTimeouts.current = new Array(barCount).fill(null);
    
    // Cleanup function
    return () => {
      // Clear all peak hold decay timeouts
      peakHoldDecayTimeouts.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [barCount]);
  
  // Calculate bar dimensions based on screen width and bar count
  const barDimensions = useMemo(() => {
    const availableWidth = screenWidth - 32; // Account for padding
    const barSpacing = 2;
    const totalSpacing = (barCount - 1) * barSpacing;
    const barWidth = Math.max(2, (availableWidth - totalSpacing) / barCount);
    
    return {
      width: barWidth,
      spacing: barSpacing,
      maxHeight: 200, // Maximum bar height in pixels
    };
  }, [barCount]);
  
  // Generate color for bar based on frequency index and amplitude
  const getBarColor = (index: number, amplitude: number): string => {
    // Create gradient from blue (low frequencies) to red (high frequencies)
    const hue = (1 - index / barCount) * 240; // 240 = blue, 0 = red
    
    // Adjust saturation and lightness based on amplitude
    const saturation = 70 + amplitude * 30; // 70-100%
    const lightness = 30 + amplitude * 50;  // 30-80%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  
  // Generate peak hold color (brighter version of bar color)
  const getPeakHoldColor = (index: number): string => {
    const hue = (1 - index / barCount) * 240;
    return `hsl(${hue}, 90%, 80%)`;
  };
  
  // Update animations based on frequency data
  useEffect(() => {
    if (!isAnalyzing || !frequencyData.length) {
      // If not analyzing, animate all bars to zero height
      barHeights.current.forEach((animatedValue) => {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      
      // Reset peak hold values
      peakHoldValues.current.fill(0);
      peakHoldAnimatedValues.current.forEach((animatedValue) => {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      
      return;
    }
    
    // Throttle updates for performance
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < updateThrottleMs) {
      return;
    }
    lastUpdateTimeRef.current = now;
    
    // Add current frequency data to ring buffer
    if (frequencyHistoryRef.current) {
      frequencyHistoryRef.current.push([...frequencyData]);
    }
    
    // Process frequency data for visualization
    const processedData = processFrequencyData(frequencyData, barCount);
    
    // Animate each bar
    processedData.forEach((amplitude, index) => {
      if (index < barHeights.current.length) {
        const targetHeight = amplitude * barDimensions.maxHeight;
        
        // Smooth animation for bar height
        Animated.timing(barHeights.current[index], {
          toValue: targetHeight,
          duration: 50, // Fast response for real-time feel
          useNativeDriver: false,
        }).start();
        
        // Update peak hold logic
        updatePeakHold(index, amplitude);
      }
    });
  }, [frequencyData, isAnalyzing, barCount, barDimensions.maxHeight]);
  
  // Process frequency data to match bar count
  const processFrequencyData = (data: number[], targetBarCount: number): number[] => {
    if (!data.length) return new Array(targetBarCount).fill(0);
    
    const result: number[] = [];
    const binSize = data.length / targetBarCount;
    
    for (let i = 0; i < targetBarCount; i++) {
      const startBin = Math.floor(i * binSize);
      const endBin = Math.floor((i + 1) * binSize);
      
      // Average the frequency bins for this bar
      let sum = 0;
      let count = 0;
      
      for (let j = startBin; j < endBin && j < data.length; j++) {
        sum += data[j];
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      // Clamp and apply some scaling for better visual effect
      result.push(Math.min(1, Math.max(0, average * 1.5)));
    }
    
    return result;
  };
  
  // Update peak hold indicators with decay animation
  const updatePeakHold = (index: number, currentAmplitude: number) => {
    const currentPeak = peakHoldValues.current[index];
    
    if (currentAmplitude > currentPeak) {
      // New peak detected
      peakHoldValues.current[index] = currentAmplitude;
      
      // Clear existing decay timeout
      if (peakHoldDecayTimeouts.current[index]) {
        clearTimeout(peakHoldDecayTimeouts.current[index]);
      }
      
      // Animate to new peak position
      const targetHeight = currentAmplitude * barDimensions.maxHeight;
      Animated.timing(peakHoldAnimatedValues.current[index], {
        toValue: targetHeight,
        duration: 50,
        useNativeDriver: false,
      }).start();
      
      // Set decay timeout
      peakHoldDecayTimeouts.current[index] = setTimeout(() => {
        // Decay peak hold value
        const decayRate = 0.95;
        peakHoldValues.current[index] *= decayRate;
        
        // Animate to decayed position
        const decayedHeight = peakHoldValues.current[index] * barDimensions.maxHeight;
        Animated.timing(peakHoldAnimatedValues.current[index], {
          toValue: decayedHeight,
          duration: 100,
          useNativeDriver: false,
        }).start();
        
        // Continue decay if still above threshold
        if (peakHoldValues.current[index] > 0.01) {
          updatePeakHold(index, 0); // Trigger decay cycle
        }
      }, 100); // Hold peak for 100ms before starting decay
    }
  };
  
  // Render individual bar
  const renderBar = (index: number) => {
    const amplitude = frequencyData.length > 0 ? 
      processFrequencyData(frequencyData, barCount)[index] || 0 : 0;
    
    return (
      <View key={index} style={[styles.barContainer, { width: barDimensions.width }]}>
        {/* Main frequency bar */}
        <Animated.View
          style={[
            styles.bar,
            {
              width: barDimensions.width,
              height: barHeights.current[index],
              backgroundColor: getBarColor(index, amplitude),
            },
          ]}
        />
        
        {/* Peak hold indicator */}
        <Animated.View
          style={[
            styles.peakHold,
            {
              width: barDimensions.width,
              backgroundColor: getPeakHoldColor(index),
              bottom: peakHoldAnimatedValues.current[index],
            },
          ]}
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.barsContainer, { height: barDimensions.maxHeight }]}>
        {Array.from({ length: barCount }, (_, index) => renderBar(index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2, // This creates the spacing between bars
  },
  barContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2, // Minimum visible height
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3, // Android shadow
  },
  peakHold: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5, // Android shadow
  },
});

export default SpectrumVisualizer;
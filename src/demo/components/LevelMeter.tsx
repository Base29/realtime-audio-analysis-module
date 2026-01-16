import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Animated } from 'react-native';
import { LevelMeterProps } from '../types/interfaces';

/**
 * Level Meter Component
 * 
 * Displays RMS and peak volume levels with rich visual effects:
 * - Pulsing circle for RMS visualization with scale and opacity animations
 * - Peak hold dot with glow effects and smooth transitions
 * - Gradient backgrounds and shadow effects
 * - Smooth scale animations using spring physics for natural motion
 * 
 * Requirements: 1.3, 3.2
 */
const LevelMeter: React.FC<LevelMeterProps> = ({
  rms,
  peak,
  rmsSmoothed,
  peakSmoothed,
  isAnalyzing,
}) => {
  // Animated values for RMS circle
  const rmsScale = useRef(new Animated.Value(0.1)).current;
  const rmsOpacity = useRef(new Animated.Value(0.3)).current;
  const rmsGlow = useRef(new Animated.Value(0)).current;
  
  // Animated values for peak indicator
  const peakScale = useRef(new Animated.Value(0)).current;
  const peakOpacity = useRef(new Animated.Value(0)).current;
  const peakPosition = useRef(new Animated.Value(0)).current;
  
  // Peak hold logic
  const peakHoldValue = useRef(0);
  const peakHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for visual effects
  const meterHeight = 200;   // Total height of the level meter
  
  // Update RMS circle animations
  useEffect(() => {
    if (!isAnalyzing) {
      // Animate to idle state when not analyzing
      Animated.parallel([
        Animated.timing(rmsScale, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rmsOpacity, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rmsGlow, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    
    // Use smoothed RMS for more stable visual effect
    const currentRms = rmsSmoothed;
    
    // Calculate target scale (0.1 to 1.0 based on RMS level)
    const targetScale = Math.max(0.1, Math.min(1.0, 0.1 + currentRms * 0.9));
    
    // Calculate target opacity (0.3 to 1.0 based on RMS level)
    const targetOpacity = Math.max(0.3, Math.min(1.0, 0.3 + currentRms * 0.7));
    
    // Calculate glow intensity (0 to 1.0 based on RMS level)
    const targetGlow = Math.max(0, Math.min(1.0, currentRms * 2));
    
    // Animate RMS circle with spring physics for natural motion
    Animated.parallel([
      Animated.spring(rmsScale, {
        toValue: targetScale,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(rmsOpacity, {
        toValue: targetOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rmsGlow, {
        toValue: targetGlow,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [rms, rmsSmoothed, isAnalyzing, rmsScale, rmsOpacity, rmsGlow]);
  
  // Update peak hold indicator
  useEffect(() => {
    if (!isAnalyzing) {
      // Reset peak when not analyzing
      peakHoldValue.current = 0;
      Animated.parallel([
        Animated.timing(peakScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(peakOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    
    // Use smoothed peak for more stable visual effect
    const currentPeak = peakSmoothed;
    
    // Update peak hold logic
    if (currentPeak > peakHoldValue.current) {
      // New peak detected
      peakHoldValue.current = currentPeak;
      
      // Clear existing decay timeout
      if (peakHoldTimeout.current) {
        clearTimeout(peakHoldTimeout.current);
      }
      
      // Calculate peak position (0 to meterHeight based on peak level)
      const targetPosition = currentPeak * (meterHeight - 20); // Leave some margin
      
      // Animate peak indicator to new position
      Animated.parallel([
        Animated.spring(peakPosition, {
          toValue: targetPosition,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(peakScale, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(peakOpacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Set decay timeout for peak hold
      peakHoldTimeout.current = setTimeout(() => {
        startPeakDecay();
      }, 500); // Hold peak for 500ms before starting decay
    }
  }, [peak, peakSmoothed, isAnalyzing, peakScale, peakOpacity, peakPosition]);
  
  // Peak decay animation
  const startPeakDecay = () => {
    const decayRate = 0.95;
    peakHoldValue.current *= decayRate;
    
    if (peakHoldValue.current > 0.01) {
      // Continue decay
      const targetPosition = peakHoldValue.current * (meterHeight - 20);
      
      Animated.parallel([
        Animated.timing(peakPosition, {
          toValue: targetPosition,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(peakOpacity, {
          toValue: Math.max(0.3, peakHoldValue.current),
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Schedule next decay step
        peakHoldTimeout.current = setTimeout(() => {
          startPeakDecay();
        }, 50);
      });
    } else {
      // Peak has decayed enough, hide it
      Animated.parallel([
        Animated.timing(peakScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(peakOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (peakHoldTimeout.current) {
        clearTimeout(peakHoldTimeout.current);
      }
    };
  }, []);
  
  // Utility functions for dB conversion
  const linearToDb = (linearValue: number): number => {
    if (linearValue <= 0) return -Infinity;
    return 20 * Math.log10(linearValue);
  };

  const formatDbValue = (dbValue: number): string => {
    if (dbValue === -Infinity) return '-∞';
    if (dbValue > 0) return `+${dbValue.toFixed(1)}`;
    return `${dbValue.toFixed(1)}`;
  };
  
  // Generate gradient colors based on RMS level
  const getRmsGradientColors = (rmsLevel: number): [string, string] => {
    if (rmsLevel < 0.3) {
      // Low level - green gradient
      return ['#4ade80', '#22c55e'];
    } else if (rmsLevel < 0.7) {
      // Medium level - yellow/orange gradient
      return ['#fbbf24', '#f59e0b'];
    } else {
      // High level - red gradient
      return ['#ef4444', '#dc2626'];
    }
  };
  
  // Generate glow color based on RMS level
  const getGlowColor = (rmsLevel: number): string => {
    if (rmsLevel < 0.3) {
      return '#22c55e';
    } else if (rmsLevel < 0.7) {
      return '#f59e0b';
    } else {
      return '#dc2626';
    }
  };
  
  const currentRms = isAnalyzing ? rmsSmoothed : 0;
  const [gradientStart, gradientEnd] = getRmsGradientColors(currentRms);
  const glowColor = getGlowColor(currentRms);
  
  // Calculate dB values for display
  const rmsDb = linearToDb(currentRms);
  const peakDb = linearToDb(isAnalyzing ? peakSmoothed : 0);
  
  return (
    <View style={styles.container}>
      {/* RMS Level Indicator - Pulsing Circle */}
      <View style={styles.rmsContainer}>
        {/* Outer glow effect */}
        <Animated.View
          style={[
            styles.rmsGlow,
            {
              transform: [{ scale: rmsScale }],
              opacity: rmsGlow,
              shadowColor: glowColor,
            },
          ]}
        />
        
        {/* Main RMS circle */}
        <Animated.View
          style={[
            styles.rmsCircle,
            {
              transform: [{ scale: rmsScale }],
              opacity: rmsOpacity,
              backgroundColor: gradientStart,
              borderColor: gradientEnd,
            },
          ]}
        >
          {/* Inner gradient effect */}
          <View
            style={[
              styles.rmsInner,
              {
                backgroundColor: gradientEnd,
              },
            ]}
          />
          
          {/* dB Value Display in center */}
          <View style={styles.dbValueContainer}>
            <Text style={styles.dbValueText}>{formatDbValue(rmsDb)}</Text>
            <Text style={styles.dbValueLabel}>RMS</Text>
          </View>
        </Animated.View>
      </View>
      
      {/* Peak Hold Indicator */}
      <View style={[styles.peakContainer, { height: meterHeight }]}>
        <Animated.View
          style={[
            styles.peakDot,
            {
              transform: [
                { translateY: Animated.multiply(peakPosition, -1) }, // Negative for upward movement
                { scale: peakScale },
              ],
              opacity: peakOpacity,
            },
          ]}
        />
        
        {/* Peak dB value display */}
        {isAnalyzing && peakDb > -Infinity && (
          <View style={styles.peakDbContainer}>
            <Text style={styles.peakDbText}>{formatDbValue(peakDb)}</Text>
            <Text style={styles.peakDbLabel}>PEAK</Text>
          </View>
        )}
        
        {/* Peak level scale markers */}
        <View style={styles.scaleMarkers}>
          {[0.25, 0.5, 0.75, 1.0].map((level, index) => (
            <View
              key={index}
              style={[
                styles.scaleMarker,
                {
                  bottom: level * (meterHeight - 20),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 250,
  },
  rmsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rmsGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  rmsCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rmsInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbValueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dbValueLabel: {
    fontSize: 10,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 2,
  },
  peakContainer: {
    position: 'relative',
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  peakDbContainer: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
  },
  peakDbText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  peakDbLabel: {
    fontSize: 8,
    color: '#ccc',
    textAlign: 'center',
  },
  peakDot: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
  scaleMarkers: {
    position: 'absolute',
    left: -10,
    right: -10,
    height: '100%',
  },
  scaleMarker: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#666666',
    opacity: 0.3,
  },
});

export default LevelMeter;
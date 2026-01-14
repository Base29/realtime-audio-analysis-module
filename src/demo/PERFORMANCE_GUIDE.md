# Rich Audio Demo - Performance Guide & Customization

This guide provides detailed performance optimization strategies and customization options for the Rich Audio Demo component.

## Table of Contents

1. [Performance Guidelines](#performance-guidelines)
2. [Memory Management](#memory-management)
3. [Animation Optimization](#animation-optimization)
4. [Device-Specific Optimizations](#device-specific-optimizations)
5. [Customization Options](#customization-options)
6. [Visual Effects Customization](#visual-effects-customization)
7. [Advanced Configuration](#advanced-configuration)
8. [Monitoring & Debugging](#monitoring--debugging)

## Performance Guidelines

### Core Performance Principles

The Rich Audio Demo is designed for optimal performance, but following these guidelines ensures the best experience across all devices:

#### 1. Frame Rate Targets
- **Target**: 30-60 FPS for smooth animations
- **Minimum**: 24 FPS for acceptable user experience
- **Critical**: Never drop below 15 FPS

#### 2. Memory Usage
- **Ring Buffer**: Automatically prevents memory growth
- **Target**: < 50MB additional memory usage
- **Monitoring**: Use React DevTools Profiler

#### 3. CPU Usage
- **Target**: < 10% CPU usage on modern devices
- **Optimization**: Automatic throttling during high load
- **Fallback**: Reduced visual effects on performance issues

### Performance Best Practices

#### Optimal Configuration

```typescript
// Recommended configuration for balanced performance
<RichAudioDemo
  barCount={32}           // Sweet spot for most devices
  autoStart={false}       // Manual control for better UX
  showDebug={false}       // Debug mode impacts performance
/>
```

#### Device-Adaptive Configuration

```typescript
import { Platform, Dimensions } from 'react-native';

const getPerformanceConfig = () => {
  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) > 600;
  const isLowEnd = Platform.OS === 'android' && Platform.Version < 26;
  
  return {
    barCount: isLowEnd ? 16 : isTablet ? 64 : 32,
    updateInterval: isLowEnd ? 100 : 50, // ms
    enableAdvancedEffects: !isLowEnd,
  };
};

const PerformanceOptimizedDemo = () => {
  const config = getPerformanceConfig();
  
  return (
    <RichAudioDemo
      barCount={config.barCount}
      showDebug={false}
      // Apply other optimizations based on config
    />
  );
};
```

#### Background/Foreground Optimization

```typescript
import { AppState } from 'react-native';

const BackgroundOptimizedDemo = () => {
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        setIsActive(false); // Stop analysis to save battery
      } else if (nextAppState === 'active') {
        setIsActive(true);  // Resume analysis
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
  return (
    <RichAudioDemo
      autoStart={isActive}
      key={isActive ? 'active' : 'inactive'} // Force remount
    />
  );
};
```

## Memory Management

### Ring Buffer Implementation

The component uses a Ring Buffer to prevent memory growth:

```typescript
// Internal Ring Buffer configuration (automatic)
const RING_BUFFER_SIZE = 100;  // Maximum stored audio frames
const MAX_FREQUENCY_BINS = 128; // Maximum FFT bins stored

// Memory usage calculation:
// ~100 frames × 128 bins × 8 bytes = ~100KB maximum
```

### Memory Monitoring

```typescript
const MemoryMonitoredDemo = () => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Monitor memory usage (development only)
      if (__DEV__) {
        const usage = performance.memory?.usedJSHeapSize || 0;
        setMemoryUsage(usage / 1024 / 1024); // Convert to MB
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View>
      <RichAudioDemo />
      {__DEV__ && (
        <Text>Memory: {memoryUsage.toFixed(1)}MB</Text>
      )}
    </View>
  );
};
```

### Memory Leak Prevention

```typescript
const LeakPreventionDemo = () => {
  const audioRef = useRef<any>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.stopAnalysis();
      }
    };
  }, []);
  
  return (
    <RichAudioDemo
      ref={audioRef}
      // Component handles internal cleanup automatically
    />
  );
};
```

## Animation Optimization

### Frame Rate Optimization

```typescript
// Custom hook for performance monitoring
const usePerformanceMonitor = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  
  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++;
      const now = Date.now();
      
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, []);
  
  return fps;
};

const FPSOptimizedDemo = () => {
  const fps = usePerformanceMonitor();
  const [reducedEffects, setReducedEffects] = useState(false);
  
  useEffect(() => {
    // Automatically reduce effects if FPS drops
    if (fps < 24 && !reducedEffects) {
      setReducedEffects(true);
    } else if (fps > 45 && reducedEffects) {
      setReducedEffects(false);
    }
  }, [fps, reducedEffects]);
  
  return (
    <RichAudioDemo
      barCount={reducedEffects ? 16 : 32}
      // Reduced effects mode would disable some animations
    />
  );
};
```

### Animation Configuration

```typescript
// Custom animation timing for different performance levels
const getAnimationConfig = (performanceLevel: 'low' | 'medium' | 'high') => {
  switch (performanceLevel) {
    case 'low':
      return {
        duration: 200,      // Slower animations
        useNativeDriver: true,
        enableGlow: false,  // Disable expensive effects
        enableGradients: false,
      };
    case 'medium':
      return {
        duration: 150,
        useNativeDriver: true,
        enableGlow: true,
        enableGradients: false,
      };
    case 'high':
      return {
        duration: 100,      // Smooth, fast animations
        useNativeDriver: true,
        enableGlow: true,
        enableGradients: true,
      };
  }
};
```

## Device-Specific Optimizations

### iOS Optimizations

```typescript
const iOSOptimizedDemo = () => {
  const isOldDevice = Platform.OS === 'ios' && parseInt(Platform.Version) < 13;
  
  return (
    <RichAudioDemo
      barCount={isOldDevice ? 24 : 48}
      // iOS handles animations efficiently with native driver
      // Older devices need reduced complexity
    />
  );
};
```

### Android Optimizations

```typescript
const AndroidOptimizedDemo = () => {
  const isLowEnd = Platform.OS === 'android' && Platform.Version < 26;
  const isHighEnd = Platform.OS === 'android' && Platform.Version >= 29;
  
  const config = {
    barCount: isLowEnd ? 16 : isHighEnd ? 64 : 32,
    enableHardwareAcceleration: isHighEnd,
    reducedMotion: isLowEnd,
  };
  
  return (
    <RichAudioDemo
      barCount={config.barCount}
      // Additional Android-specific optimizations
    />
  );
};
```

### Cross-Platform Performance Detection

```typescript
import DeviceInfo from 'react-native-device-info';

const DeviceAdaptiveDemo = () => {
  const [deviceTier, setDeviceTier] = useState<'low' | 'medium' | 'high'>('medium');
  
  useEffect(() => {
    const detectDeviceTier = async () => {
      try {
        const totalMemory = await DeviceInfo.getTotalMemory();
        const isTablet = await DeviceInfo.isTablet();
        
        // Simple heuristic for device performance
        if (totalMemory < 2 * 1024 * 1024 * 1024) { // < 2GB RAM
          setDeviceTier('low');
        } else if (totalMemory > 6 * 1024 * 1024 * 1024 || isTablet) { // > 6GB RAM or tablet
          setDeviceTier('high');
        } else {
          setDeviceTier('medium');
        }
      } catch (error) {
        console.warn('Device detection failed:', error);
        setDeviceTier('medium'); // Safe default
      }
    };
    
    detectDeviceTier();
  }, []);
  
  const getConfigForTier = (tier: string) => {
    switch (tier) {
      case 'low':
        return { barCount: 16, showDebug: false };
      case 'high':
        return { barCount: 64, showDebug: true };
      default:
        return { barCount: 32, showDebug: false };
    }
  };
  
  const config = getConfigForTier(deviceTier);
  
  return <RichAudioDemo {...config} />;
};
```

## Customization Options

### Visual Customization

#### Color Schemes

```typescript
// Custom color schemes for different themes
const colorSchemes = {
  neon: {
    primary: '#00ff88',
    secondary: '#ff0088',
    background: '#000011',
    accent: '#8800ff',
  },
  ocean: {
    primary: '#0088ff',
    secondary: '#00ffff',
    background: '#001122',
    accent: '#0044aa',
  },
  fire: {
    primary: '#ff4400',
    secondary: '#ffaa00',
    background: '#220000',
    accent: '#aa2200',
  },
  monochrome: {
    primary: '#ffffff',
    secondary: '#cccccc',
    background: '#000000',
    accent: '#666666',
  },
};

const ThemedDemo = ({ theme = 'neon' }) => {
  const colors = colorSchemes[theme];
  
  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <RichAudioDemo
        // Theme would be applied through custom styling
        // This is a conceptual example
      />
    </View>
  );
};
```

#### Bar Customization

```typescript
// Different spectrum bar styles
const barStyles = {
  classic: {
    barCount: 32,
    barWidth: 'auto',
    barSpacing: 2,
    cornerRadius: 0,
  },
  modern: {
    barCount: 48,
    barWidth: 'auto',
    barSpacing: 1,
    cornerRadius: 4,
  },
  minimal: {
    barCount: 16,
    barWidth: 'auto',
    barSpacing: 4,
    cornerRadius: 8,
  },
  dense: {
    barCount: 128,
    barWidth: 'auto',
    barSpacing: 0,
    cornerRadius: 0,
  },
};

const CustomStyledDemo = ({ style = 'modern' }) => {
  const config = barStyles[style];
  
  return (
    <RichAudioDemo
      barCount={config.barCount}
      // Additional styling would be applied through props
    />
  );
};
```

### Layout Customization

```typescript
// Different layout configurations
const layoutConfigs = {
  fullscreen: {
    spectrumHeight: '60%',
    meterHeight: '30%',
    controlsHeight: '10%',
  },
  compact: {
    spectrumHeight: '50%',
    meterHeight: '25%',
    controlsHeight: '25%',
  },
  minimal: {
    spectrumHeight: '80%',
    meterHeight: '20%',
    controlsHeight: '0%', // Hidden
  },
};

const CustomLayoutDemo = ({ layout = 'fullscreen' }) => {
  const config = layoutConfigs[layout];
  
  return (
    <View style={{ flex: 1 }}>
      {/* Custom layout implementation */}
      <RichAudioDemo />
    </View>
  );
};
```

## Visual Effects Customization

### Glow Effects

```typescript
// Custom glow effect configurations
const glowEffects = {
  subtle: {
    intensity: 0.3,
    radius: 5,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  moderate: {
    intensity: 0.6,
    radius: 10,
    color: 'rgba(0, 255, 136, 0.6)',
  },
  intense: {
    intensity: 1.0,
    radius: 20,
    color: 'rgba(255, 0, 136, 1.0)',
  },
  disabled: {
    intensity: 0,
    radius: 0,
    color: 'transparent',
  },
};

const GlowCustomizedDemo = ({ glowLevel = 'moderate' }) => {
  const glow = glowEffects[glowLevel];
  
  return (
    <RichAudioDemo
      // Glow effects would be configured through styling props
      // This is a conceptual example
    />
  );
};
```

### Animation Presets

```typescript
// Different animation presets
const animationPresets = {
  smooth: {
    duration: 150,
    easing: 'easeInOut',
    springTension: 100,
    springFriction: 8,
  },
  bouncy: {
    duration: 200,
    easing: 'easeOutBack',
    springTension: 200,
    springFriction: 6,
  },
  sharp: {
    duration: 100,
    easing: 'easeOut',
    springTension: 300,
    springFriction: 10,
  },
  slow: {
    duration: 300,
    easing: 'easeInOut',
    springTension: 50,
    springFriction: 12,
  },
};

const AnimationCustomizedDemo = ({ preset = 'smooth' }) => {
  const animation = animationPresets[preset];
  
  return (
    <RichAudioDemo
      // Animation configuration would be passed through props
      // This is a conceptual example
    />
  );
};
```

## Advanced Configuration

### Audio Analysis Customization

```typescript
// Advanced audio analysis configurations
const analysisConfigs = {
  highResolution: {
    fftSize: 4096,
    sampleRate: 48000,
    windowFunction: 'blackman',
    smoothing: 0.9,
  },
  lowLatency: {
    fftSize: 512,
    sampleRate: 44100,
    windowFunction: 'hanning',
    smoothing: 0.3,
  },
  balanced: {
    fftSize: 2048,
    sampleRate: 44100,
    windowFunction: 'hanning',
    smoothing: 0.7,
  },
  realtime: {
    fftSize: 1024,
    sampleRate: 44100,
    windowFunction: 'rectangular',
    smoothing: 0.1,
  },
};

const AdvancedConfigDemo = ({ config = 'balanced' }) => {
  const { isAnalyzing, startAnalysis } = useRealtimeAudioLevels();
  const analysisConfig = analysisConfigs[config];
  
  useEffect(() => {
    if (isAnalyzing) {
      startAnalysis(analysisConfig);
    }
  }, [config]);
  
  return <RichAudioDemo />;
};
```

### Custom Hook Configuration

```typescript
// Custom hook with advanced configuration
const useCustomAudioLevels = (config: CustomConfig) => {
  const {
    frequencyData,
    rms,
    peak,
    startAnalysis,
    stopAnalysis,
    ...rest
  } = useRealtimeAudioLevels();
  
  // Custom processing
  const processedFrequencyData = useMemo(() => {
    if (!frequencyData.length) return [];
    
    // Apply custom frequency weighting
    return frequencyData.map((value, index) => {
      const frequency = (index / frequencyData.length) * (config.sampleRate / 2);
      const weight = config.frequencyWeighting(frequency);
      return value * weight;
    });
  }, [frequencyData, config]);
  
  // Custom smoothing
  const [smoothedRMS, setSmoothedRMS] = useState(0);
  useEffect(() => {
    setSmoothedRMS(prev => 
      prev * config.smoothingFactor + rms * (1 - config.smoothingFactor)
    );
  }, [rms, config.smoothingFactor]);
  
  return {
    ...rest,
    frequencyData: processedFrequencyData,
    rms: smoothedRMS,
    peak,
    startAnalysis,
    stopAnalysis,
  };
};

// Usage
const CustomProcessingDemo = () => {
  const customConfig = {
    smoothingFactor: 0.8,
    sampleRate: 44100,
    frequencyWeighting: (freq: number) => {
      // A-weighting approximation for human hearing
      return Math.pow(freq / 1000, 0.5);
    },
  };
  
  const audioData = useCustomAudioLevels(customConfig);
  
  return (
    <SpectrumVisualizer 
      frequencyData={audioData.frequencyData}
      barCount={32}
    />
  );
};
```

## Monitoring & Debugging

### Performance Monitoring

```typescript
const PerformanceMonitoringDemo = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
  });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: frameCount,
          renderTime: (now - lastTime) / frameCount,
        }));
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    measurePerformance();
  }, []);
  
  return (
    <View>
      <RichAudioDemo showDebug={true} />
      
      {__DEV__ && (
        <View style={styles.metricsPanel}>
          <Text>FPS: {metrics.fps}</Text>
          <Text>Render Time: {metrics.renderTime.toFixed(2)}ms</Text>
          <Text>Memory: {metrics.memoryUsage.toFixed(1)}MB</Text>
        </View>
      )}
    </View>
  );
};
```

### Debug Configuration

```typescript
// Enhanced debug mode with custom metrics
const DebugEnhancedDemo = () => {
  const [debugLevel, setDebugLevel] = useState<'basic' | 'advanced' | 'expert'>('basic');
  
  const debugConfig = {
    basic: {
      showFPS: true,
      showAudioLevels: true,
      showErrors: true,
    },
    advanced: {
      showFPS: true,
      showAudioLevels: true,
      showErrors: true,
      showMemoryUsage: true,
      showFrequencyData: true,
    },
    expert: {
      showFPS: true,
      showAudioLevels: true,
      showErrors: true,
      showMemoryUsage: true,
      showFrequencyData: true,
      showRenderMetrics: true,
      showInternalState: true,
    },
  };
  
  return (
    <RichAudioDemo 
      showDebug={true}
      // Debug configuration would be passed through props
    />
  );
};
```

### Custom Logging

```typescript
// Custom logging for performance analysis
const LoggingDemo = () => {
  const logPerformance = useCallback((metrics: any) => {
    if (__DEV__) {
      console.log('Performance Metrics:', {
        timestamp: Date.now(),
        fps: metrics.fps,
        memoryUsage: metrics.memoryUsage,
        audioLatency: metrics.audioLatency,
      });
    }
  }, []);
  
  return (
    <RichAudioDemo 
      onPerformanceUpdate={logPerformance}
      // Custom performance callback
    />
  );
};
```

## Best Practices Summary

### Performance Checklist

- [ ] Use appropriate `barCount` for target device performance
- [ ] Enable `autoStart={false}` for better user control
- [ ] Disable `showDebug` in production builds
- [ ] Implement background/foreground optimization
- [ ] Monitor memory usage during development
- [ ] Test on lowest-spec target devices
- [ ] Use React DevTools Profiler for optimization
- [ ] Implement graceful degradation for performance issues

### Customization Checklist

- [ ] Choose appropriate color scheme for app theme
- [ ] Configure bar count and spacing for desired visual density
- [ ] Set up animation presets matching app's motion design
- [ ] Configure audio analysis parameters for use case
- [ ] Implement custom error handling for app-specific needs
- [ ] Add performance monitoring for production apps
- [ ] Test customizations across different device types
- [ ] Document custom configurations for team consistency

This performance guide provides comprehensive strategies for optimizing the Rich Audio Demo component while maintaining flexibility for extensive customization to match your application's specific needs and performance requirements.
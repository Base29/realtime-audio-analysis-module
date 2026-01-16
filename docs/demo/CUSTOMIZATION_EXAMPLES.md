# Rich Audio Demo - Customization Examples

This document provides practical, copy-paste examples for customizing the Rich Audio Demo component to match your application's design and functionality requirements.

## Table of Contents

1. [Theme Customization](#theme-customization)
2. [Layout Variations](#layout-variations)
3. [Animation Styles](#animation-styles)
4. [Custom Components](#custom-components)
5. [Integration Patterns](#integration-patterns)
6. [Performance Configurations](#performance-configurations)

## Theme Customization

### Dark Theme Implementation

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const DarkThemeDemo = () => {
  return (
    <View style={darkStyles.container}>
      <RichAudioDemo
        barCount={32}
        showDebug={false}
        autoStart={false}
      />
    </View>
  );
};

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  // Additional dark theme styles would be applied
  // through component styling props when available
});

export default DarkThemeDemo;
```

### Neon Theme Implementation

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';
import LinearGradient from 'react-native-linear-gradient';

const NeonThemeDemo = () => {
  return (
    <LinearGradient
      colors={['#000011', '#001122', '#000033']}
      style={neonStyles.container}
    >
      <RichAudioDemo
        barCount={48}
        showDebug={false}
        autoStart={true}
      />
    </LinearGradient>
  );
};

const neonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  // Neon glow effects would be implemented through
  // custom styling when component supports it
});

export default NeonThemeDemo;
```

### Minimalist Theme Implementation

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const MinimalistThemeDemo = () => {
  return (
    <View style={minimalStyles.container}>
      <RichAudioDemo
        barCount={16}
        showDebug={false}
        autoStart={false}
      />
    </View>
  );
};

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 30,
    justifyContent: 'center',
  },
  // Clean, minimal styling
});

export default MinimalistThemeDemo;
```

## Layout Variations

### Full-Screen Visualizer

```typescript
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const FullScreenVisualizerDemo = () => {
  return (
    <View style={fullScreenStyles.container}>
      <StatusBar hidden />
      <RichAudioDemo
        barCount={64}
        showDebug={false}
        autoStart={true}
      />
    </View>
  );
};

const fullScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default FullScreenVisualizerDemo;
```

### Split Layout with Controls

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RichAudioDemo, useRealtimeAudioLevels } from 'react-native-realtime-audio-analysis';

const SplitLayoutDemo = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { startAnalysis, stopAnalysis, permissionStatus } = useRealtimeAudioLevels();

  const handleToggle = async () => {
    if (isAnalyzing) {
      await stopAnalysis();
      setIsAnalyzing(false);
    } else {
      await startAnalysis();
      setIsAnalyzing(true);
    }
  };

  return (
    <View style={splitStyles.container}>
      {/* Visualizer Section */}
      <View style={splitStyles.visualizerSection}>
        <RichAudioDemo
          barCount={32}
          showDebug={false}
          autoStart={false}
        />
      </View>
      
      {/* Controls Section */}
      <View style={splitStyles.controlsSection}>
        <Text style={splitStyles.title}>Audio Visualizer</Text>
        <Text style={splitStyles.status}>
          Status: {isAnalyzing ? 'Active' : 'Stopped'}
        </Text>
        <Text style={splitStyles.permission}>
          Permission: {permissionStatus}
        </Text>
        
        <TouchableOpacity 
          style={[splitStyles.button, isAnalyzing && splitStyles.buttonActive]}
          onPress={handleToggle}
        >
          <Text style={splitStyles.buttonText}>
            {isAnalyzing ? 'Stop' : 'Start'} Analysis
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const splitStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  visualizerSection: {
    flex: 2,
    padding: 20,
  },
  controlsSection: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  permission: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SplitLayoutDemo;
```

### Compact Widget Layout

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const CompactWidgetDemo = () => {
  return (
    <View style={compactStyles.container}>
      <View style={compactStyles.widget}>
        <RichAudioDemo
          barCount={16}
          showDebug={false}
          autoStart={true}
        />
      </View>
    </View>
  );
};

const compactStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  widget: {
    width: 300,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CompactWidgetDemo;
```

## Animation Styles

### Smooth Animations

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const SmoothAnimationDemo = () => {
  return (
    <View style={smoothStyles.container}>
      <RichAudioDemo
        barCount={32}
        showDebug={false}
        autoStart={false}
        // Smooth animation configuration would be applied through props
        // when the component supports animation customization
      />
    </View>
  );
};

const smoothStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
});

export default SmoothAnimationDemo;
```

### Bouncy Animations

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const BouncyAnimationDemo = () => {
  return (
    <View style={bouncyStyles.container}>
      <RichAudioDemo
        barCount={24}
        showDebug={false}
        autoStart={true}
        // Bouncy animation configuration would be applied through props
      />
    </View>
  );
};

const bouncyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },
});

export default BouncyAnimationDemo;
```

## Custom Components

### Custom Spectrum Visualizer Integration

```typescript
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { 
  useRealtimeAudioLevels,
  SpectrumVisualizer,
  LevelMeter 
} from 'react-native-realtime-audio-analysis';

const CustomSpectrumDemo = () => {
  const {
    frequencyData,
    rms,
    peak,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
  } = useRealtimeAudioLevels();

  return (
    <View style={customStyles.container}>
      {/* Custom Header */}
      <View style={customStyles.header}>
        <Text style={customStyles.headerText}>Custom Audio Visualizer</Text>
      </View>

      {/* Main Spectrum Display */}
      <View style={customStyles.spectrumContainer}>
        <SpectrumVisualizer 
          frequencyData={frequencyData}
          barCount={40}
          isAnalyzing={isAnalyzing}
        />
      </View>

      {/* Level Meters Row */}
      <View style={customStyles.metersRow}>
        <View style={customStyles.meterContainer}>
          <Text style={customStyles.meterLabel}>RMS</Text>
          <LevelMeter 
            rms={rms}
            peak={0}
            rmsSmoothed={rms}
            peakSmoothed={0}
            isAnalyzing={isAnalyzing}
          />
        </View>
        
        <View style={customStyles.meterContainer}>
          <Text style={customStyles.meterLabel}>Peak</Text>
          <LevelMeter 
            rms={0}
            peak={peak}
            rmsSmoothed={0}
            peakSmoothed={peak}
            isAnalyzing={isAnalyzing}
          />
        </View>
      </View>

      {/* Custom Controls */}
      <View style={customStyles.controlsContainer}>
        <TouchableOpacity 
          style={[customStyles.controlButton, isAnalyzing && customStyles.activeButton]}
          onPress={isAnalyzing ? stopAnalysis : startAnalysis}
        >
          <Text style={customStyles.controlButtonText}>
            {isAnalyzing ? '⏸️ Stop' : '▶️ Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const customStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  spectrumContainer: {
    flex: 1,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a3a',
  },
  metersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  meterContainer: {
    alignItems: 'center',
  },
  meterLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#333366',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 120,
  },
  activeButton: {
    backgroundColor: '#ff6b6b',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CustomSpectrumDemo;
```

## Integration Patterns

### Modal Integration

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const ModalIntegrationDemo = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={modalStyles.container}>
      <TouchableOpacity 
        style={modalStyles.openButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={modalStyles.openButtonText}>Open Audio Visualizer</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Audio Visualizer</Text>
            <TouchableOpacity 
              style={modalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={modalStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.modalContent}>
            <RichAudioDemo
              barCount={48}
              showDebug={true}
              autoStart={true}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  openButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});

export default ModalIntegrationDemo;
```

### Tab Navigation Integration

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const Tab = createBottomTabNavigator();

const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
  </View>
);

const AudioScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#000000' }}>
    <RichAudioDemo
      barCount={32}
      showDebug={false}
      autoStart={false}
    />
  </View>
);

const SettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Settings Screen</Text>
  </View>
);

const TabNavigationDemo = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1a1a1a' },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Audio" component={AudioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigationDemo;
```

## Performance Configurations

### Low-End Device Configuration

```typescript
import React from 'react';
import { View, Platform } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const LowEndDeviceDemo = () => {
  const isLowEndDevice = Platform.OS === 'android' && Platform.Version < 26;
  
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <RichAudioDemo
        barCount={isLowEndDevice ? 12 : 24}
        showDebug={false}
        autoStart={false}
        // Additional low-end optimizations would be configured here
      />
    </View>
  );
};

export default LowEndDeviceDemo;
```

### High-Performance Configuration

```typescript
import React from 'react';
import { View } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const HighPerformanceDemo = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <RichAudioDemo
        barCount={128}        // High resolution
        showDebug={true}      // Full debug info
        autoStart={true}      // Immediate start
        // High-performance settings would be configured here
      />
    </View>
  );
};

export default HighPerformanceDemo;
```

### Battery-Optimized Configuration

```typescript
import React, { useEffect, useState } from 'react';
import { View, AppState } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

const BatteryOptimizedDemo = () => {
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsActive(nextAppState === 'active');
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {isActive && (
        <RichAudioDemo
          barCount={24}
          showDebug={false}
          autoStart={isActive}
        />
      )}
    </View>
  );
};

export default BatteryOptimizedDemo;
```

These examples provide practical, ready-to-use implementations that you can copy and adapt for your specific use cases. Each example demonstrates different aspects of customization while maintaining good performance and user experience practices.
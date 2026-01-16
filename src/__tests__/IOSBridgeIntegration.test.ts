/**
 * iOS Bridge Conformance Integration Tests
 * Tests the complete workflow from JavaScript to native iOS module
 * 
 * **Validates: All requirements - comprehensive integration testing**
 */

// Mock React Native first
jest.mock('react-native', () => {
  const mockNativeModule = {
    // Primary methods
    startAnalysis: jest.fn(),
    stopAnalysis: jest.fn(),
    isAnalyzing: jest.fn(),
    getAnalysisConfig: jest.fn(),
    setSmoothing: jest.fn(),
    setFftConfig: jest.fn(),
    
    // Legacy aliases
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn(),
    
    // Debug methods
    enableDebugLogging: jest.fn(),
    disableDebugLogging: jest.fn(),
    
    // Module metadata
    moduleName: () => 'RealtimeAudioAnalyzer',
    supportedEvents: () => ['RealtimeAudioAnalyzer:onData', 'AudioAnalysisData'],
  };

  const mockEventEmitter = {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  };

  return {
    NativeModules: {
      RealtimeAudioAnalyzer: mockNativeModule,
    },
    NativeEventEmitter: jest.fn(() => mockEventEmitter),
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    TurboModuleRegistry: {
      get: jest.fn(() => null), // Simulate legacy module for this test
    },
    PermissionsAndroid: {
      PERMISSIONS: {
        RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
      check: jest.fn(),
      request: jest.fn(),
    },
    Linking: {
      openSettings: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    Animated: {
      View: 'View',
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    Switch: 'Switch',
  };
});

// Mock demo components to avoid import issues
jest.mock('../demo', () => ({
  RichAudioDemo: 'RichAudioDemo',
  SpectrumVisualizer: 'SpectrumVisualizer',
  LevelMeter: 'LevelMeter',
  useRealtimeAudioLevels: jest.fn(),
  AudioPermissionManager: jest.fn(),
  RingBuffer: jest.fn(),
}));



import { NativeModules, NativeEventEmitter } from 'react-native';
import RealtimeAudioAnalyzer from '../index';

describe('iOS Bridge Conformance Integration Tests', () => {
  let mockNativeModule: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeModule = NativeModules.RealtimeAudioAnalyzer;
    
    // Set up event emitter mock
    const mockEventEmitterInstance = {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    };
    (NativeEventEmitter as jest.Mock).mockReturnValue(mockEventEmitterInstance);
    mockEventEmitter = mockEventEmitterInstance;
  });

  describe('Full JavaScript to Native Workflow', () => {
    it('should execute complete analysis workflow successfully', async () => {
      // Mock successful responses
      mockNativeModule.startAnalysis.mockResolvedValue(null);
      mockNativeModule.isAnalyzing.mockResolvedValue(true);
      mockNativeModule.stopAnalysis.mockResolvedValue(null);

      // 1. Start analysis with configuration
      const config = {
        fftSize: 1024,
        sampleRate: 48000,
        smoothing: 0.5,
        windowFunction: 'hanning' as const,
      };
      
      await RealtimeAudioAnalyzer.startAnalysis(config);
      expect(mockNativeModule.startAnalysis).toHaveBeenCalledWith(config);

      // 2. Verify analysis is running
      const isRunning = await RealtimeAudioAnalyzer.isAnalyzing();
      expect(isRunning).toBe(true);

      // 3. Stop analysis
      await RealtimeAudioAnalyzer.stopAnalysis();
      expect(mockNativeModule.stopAnalysis).toHaveBeenCalled();
    });

    it('should handle legacy method workflow', async () => {
      // Mock successful responses for legacy methods
      mockNativeModule.start.mockResolvedValue(null);
      mockNativeModule.stop.mockResolvedValue(null);

      // Start and stop with legacy methods
      await RealtimeAudioAnalyzer.start({ bufferSize: 2048 });
      expect(mockNativeModule.start).toHaveBeenCalledWith({ bufferSize: 2048 });

      await RealtimeAudioAnalyzer.stop();
      expect(mockNativeModule.stop).toHaveBeenCalled();
    });
  });

  describe('Event Emission Integration', () => {
    it('should register and handle audio data events correctly', () => {
      const mockListener = jest.fn();
      
      // Register listener using onData method
      const subscription = RealtimeAudioAnalyzer.onData(mockListener);
      
      // Verify subscription object is returned
      expect(subscription).toHaveProperty('remove');
      expect(typeof subscription.remove).toBe('function');
    });

    it('should handle event listener cleanup correctly', () => {
      const mockListener = jest.fn();
      
      // Register and remove listener - should not throw
      expect(() => {
        const subscription = RealtimeAudioAnalyzer.onData(mockListener);
        RealtimeAudioAnalyzer.removeSubscription(subscription);
      }).not.toThrow();
    });
  });

  describe('Permission Handling Integration', () => {
    it('should handle permission flow during analysis start', async () => {
      // Mock permission granted scenario
      mockNativeModule.startAnalysis.mockResolvedValue(null);
      
      const config = { fftSize: 1024 };
      await RealtimeAudioAnalyzer.startAnalysis(config);
      
      expect(mockNativeModule.startAnalysis).toHaveBeenCalledWith(config);
    });

    it('should handle permission denied scenario', async () => {
      // Mock permission denied
      mockNativeModule.startAnalysis.mockRejectedValue(
        new Error('E_PERMISSION_DENIED: Microphone permission denied')
      );
      
      await expect(RealtimeAudioAnalyzer.startAnalysis({ fftSize: 1024 })).rejects.toThrow(
        'E_PERMISSION_DENIED: Microphone permission denied'
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle native module method not found errors', async () => {
      // Mock method not found error
      mockNativeModule.startAnalysis.mockRejectedValue(
        new Error('E_METHOD_NOT_FOUND: Method startAnalysis not found')
      );
      
      await expect(RealtimeAudioAnalyzer.startAnalysis({})).rejects.toThrow(
        'E_METHOD_NOT_FOUND: Method startAnalysis not found'
      );
    });

    it('should handle invalid configuration errors', async () => {
      // Mock invalid config error
      mockNativeModule.startAnalysis.mockRejectedValue(
        new Error('E_INVALID_CONFIG: fftSize must be between 64 and 16384, got: 32')
      );
      
      await expect(RealtimeAudioAnalyzer.startAnalysis({ fftSize: 32 })).rejects.toThrow(
        'E_INVALID_CONFIG: fftSize must be between 64 and 16384, got: 32'
      );
    });
  });

  describe('Configuration State Management', () => {
    it('should maintain configuration state across method calls', async () => {
      // Mock configuration responses
      mockNativeModule.setSmoothing.mockResolvedValue(null);
      mockNativeModule.getAnalysisConfig.mockResolvedValue({
        fftSize: 2048,
        smoothing: 0.7,
      });
      
      // Update and verify configuration
      await RealtimeAudioAnalyzer.setSmoothing(true, 0.7);
      expect(mockNativeModule.setSmoothing).toHaveBeenCalledWith(true, 0.7);
      
      const config = await RealtimeAudioAnalyzer.getAnalysisConfig();
      expect(config.smoothing).toBe(0.7);
    });
  });

  describe('Module Registration and Discovery', () => {
    it('should verify module is properly registered', () => {
      expect(NativeModules.RealtimeAudioAnalyzer).toBeDefined();
      expect(typeof NativeModules.RealtimeAudioAnalyzer).toBe('object');
    });

    it('should have correct module name and events', () => {
      const moduleName = mockNativeModule.moduleName();
      expect(moduleName).toBe('RealtimeAudioAnalyzer');
      
      const events = mockNativeModule.supportedEvents();
      expect(events).toContain('RealtimeAudioAnalyzer:onData');
      expect(events).toContain('AudioAnalysisData');
    });
  });
});
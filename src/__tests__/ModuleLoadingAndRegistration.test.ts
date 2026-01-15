/**
 * Module Loading and Registration Tests
 * Tests that verify the module loads correctly in React Native app
 * and JavaScript import and method calls work properly
 * 
 * **Validates: Requirements 1.4, 5.3**
 */

// Mock React Native modules
jest.mock('react-native', () => {
  const mockNativeModule = {
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn(),
    startAnalysis: jest.fn(),
    stopAnalysis: jest.fn(),
    isAnalyzing: jest.fn(),
    getAnalysisConfig: jest.fn(),
    setSmoothing: jest.fn(),
    setFftConfig: jest.fn(),
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
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    TurboModuleRegistry: {
      get: jest.fn(() => null), // Simulate legacy module for this test
    },
  };
});

import { NativeModules, NativeEventEmitter } from 'react-native';
import RealtimeAudioAnalyzer from '../index';

describe('Module Loading and Registration', () => {
  let mockNativeModule: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeModule = NativeModules.RealtimeAudioAnalyzer;
    mockEventEmitter = (NativeEventEmitter as jest.Mock).mock.results[0]?.value;
  });

  describe('Module Discovery and Loading', () => {
    it('should find the native module in NativeModules', () => {
      expect(NativeModules.RealtimeAudioAnalyzer).toBeDefined();
      expect(typeof NativeModules.RealtimeAudioAnalyzer).toBe('object');
    });

    it('should have correct module name', () => {
      const moduleName = mockNativeModule.moduleName();
      expect(moduleName).toBe('RealtimeAudioAnalyzer');
    });

    it('should support required events', () => {
      const events = mockNativeModule.supportedEvents();
      expect(events).toContain('RealtimeAudioAnalyzer:onData');
      expect(events).toContain('AudioAnalysisData');
    });

    it('should create NativeEventEmitter with module instance', () => {
      // Import triggers module loading
      expect(NativeEventEmitter).toHaveBeenCalledWith(mockNativeModule);
    });
  });

  describe('JavaScript API Import and Usage', () => {
    it('should import RealtimeAudioAnalyzer successfully', () => {
      expect(RealtimeAudioAnalyzer).toBeDefined();
      expect(typeof RealtimeAudioAnalyzer).toBe('object');
    });

    it('should have all required methods', () => {
      const requiredMethods = [
        'start',
        'stop',
        'isRunning',
        'startAnalysis',
        'stopAnalysis',
        'isAnalyzing',
        'getAnalysisConfig',
        'setSmoothing',
        'setFftConfig',
        'onData',
        'addListener',
        'removeListeners',
      ];

      requiredMethods.forEach(method => {
        expect(RealtimeAudioAnalyzer[method]).toBeDefined();
        expect(typeof RealtimeAudioAnalyzer[method]).toBe('function');
      });
    });

    it('should call native methods through JavaScript API', async () => {
      mockNativeModule.startAnalysis.mockResolvedValue(null);
      mockNativeModule.stopAnalysis.mockResolvedValue(null);
      mockNativeModule.isAnalyzing.mockResolvedValue(false);

      // Test startAnalysis
      await RealtimeAudioAnalyzer.startAnalysis({ fftSize: 1024 });
      expect(mockNativeModule.startAnalysis).toHaveBeenCalledWith({ fftSize: 1024 });

      // Test stopAnalysis
      await RealtimeAudioAnalyzer.stopAnalysis();
      expect(mockNativeModule.stopAnalysis).toHaveBeenCalled();

      // Test isAnalyzing
      const isAnalyzing = await RealtimeAudioAnalyzer.isAnalyzing();
      expect(mockNativeModule.isAnalyzing).toHaveBeenCalled();
      expect(isAnalyzing).toBe(false);
    });

    it('should handle backward compatibility methods', async () => {
      mockNativeModule.start.mockResolvedValue(null);
      mockNativeModule.stop.mockResolvedValue(null);
      mockNativeModule.isRunning.mockResolvedValue(true);

      // Test legacy start method
      await RealtimeAudioAnalyzer.start({ bufferSize: 2048 });
      expect(mockNativeModule.start).toHaveBeenCalledWith({ bufferSize: 2048 });

      // Test legacy stop method
      await RealtimeAudioAnalyzer.stop();
      expect(mockNativeModule.stop).toHaveBeenCalled();

      // Test legacy isRunning method
      const isRunning = await RealtimeAudioAnalyzer.isRunning();
      expect(mockNativeModule.isRunning).toHaveBeenCalled();
      expect(isRunning).toBe(true);
    });
  });

  describe('Event Listener Registration', () => {
    it('should register event listeners successfully', () => {
      const mockListener = jest.fn();
      
      // Test onData method
      const subscription = RealtimeAudioAnalyzer.onData(mockListener);
      expect(mockEventEmitter.addListener).toHaveBeenCalledWith('RealtimeAudioAnalyzer:onData', mockListener);
      expect(subscription).toHaveProperty('remove');
      expect(typeof subscription.remove).toBe('function');
    });

    it('should support addListener with callback only', () => {
      const mockListener = jest.fn();
      
      const subscription = RealtimeAudioAnalyzer.addListener(mockListener);
      expect(mockEventEmitter.addListener).toHaveBeenCalledWith('RealtimeAudioAnalyzer:onData', mockListener);
      expect(subscription).toHaveProperty('remove');
    });

    it('should support addListener with event name and callback', () => {
      const mockListener = jest.fn();
      
      const subscription = RealtimeAudioAnalyzer.addListener('AudioAnalysisData', mockListener);
      expect(mockEventEmitter.addListener).toHaveBeenCalledWith('AudioAnalysisData', mockListener);
      expect(subscription).toHaveProperty('remove');
    });

    it('should remove listeners correctly', () => {
      RealtimeAudioAnalyzer.removeListeners('RealtimeAudioAnalyzer:onData');
      expect(mockEventEmitter.removeAllListeners).toHaveBeenCalledWith('RealtimeAudioAnalyzer:onData');
    });
  });

  describe('Configuration Methods', () => {
    it('should call setSmoothing method', async () => {
      mockNativeModule.setSmoothing.mockResolvedValue(null);
      
      await RealtimeAudioAnalyzer.setSmoothing(true, 0.7);
      expect(mockNativeModule.setSmoothing).toHaveBeenCalledWith(true, 0.7);
    });

    it('should call setFftConfig method', async () => {
      mockNativeModule.setFftConfig.mockResolvedValue(null);
      
      await RealtimeAudioAnalyzer.setFftConfig(2048, 256);
      expect(mockNativeModule.setFftConfig).toHaveBeenCalledWith(2048, 256);
    });

    it('should get analysis configuration', async () => {
      const mockConfig = {
        fftSize: 1024,
        sampleRate: 48000,
        bufferSize: 1024,
        smoothingEnabled: true,
        smoothingFactor: 0.5,
      };
      mockNativeModule.getAnalysisConfig.mockResolvedValue(mockConfig);
      
      const config = await RealtimeAudioAnalyzer.getAnalysisConfig();
      expect(mockNativeModule.getAnalysisConfig).toHaveBeenCalled();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing listener function in onData', () => {
      expect(() => {
        RealtimeAudioAnalyzer.onData(null as any);
      }).toThrow('RealtimeAudioAnalyzer.onData(listener): listener must be a function');
    });

    it('should handle missing listener function in addListener', () => {
      expect(() => {
        RealtimeAudioAnalyzer.addListener('AudioAnalysisData', null as any);
      }).toThrow('RealtimeAudioAnalyzer.addListener(eventName, listener): listener must be a function');
    });

    it('should handle subscription removal', () => {
      const mockRemove = jest.fn();
      const subscription = { remove: mockRemove };
      
      RealtimeAudioAnalyzer.removeSubscription(subscription);
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
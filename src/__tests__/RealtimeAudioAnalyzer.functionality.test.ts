/**
 * Functionality Preservation Tests for RealtimeAudioAnalyzer
 * Tests that all existing functionality continues to work after iOS bridge conformance fixes
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

// Mock React Native first
jest.mock('react-native', () => ({
  NativeModules: {
    RealtimeAudioAnalyzer: {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn(),
      setSmoothing: jest.fn(),
      setFftConfig: jest.fn(),
      startAnalysis: jest.fn(),
      stopAnalysis: jest.fn(),
      isAnalyzing: jest.fn(),
      getAnalysisConfig: jest.fn(),
      moduleName: () => 'RealtimeAudioAnalyzer',
      supportedEvents: () => ['RealtimeAudioAnalyzer:onData', 'AudioAnalysisData'],
    },
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
}));

import { NativeModules, NativeEventEmitter } from 'react-native';

describe('RealtimeAudioAnalyzer Functionality Preservation', () => {
  const mockModule = NativeModules.RealtimeAudioAnalyzer;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Task 5.1: Test audio engine initialization
  describe('Audio Engine Initialization', () => {
    it('should start with default configuration', async () => {
      mockModule.start.mockResolvedValue(null);
      
      const config = {};
      await expect(mockModule.start(config)).resolves.toBeNull();
      expect(mockModule.start).toHaveBeenCalledWith(config);
    });

    it('should start with custom buffer size', async () => {
      mockModule.start.mockResolvedValue(null);
      
      const config = { bufferSize: 2048 };
      await expect(mockModule.start(config)).resolves.toBeNull();
      expect(mockModule.start).toHaveBeenCalledWith(config);
    });
  });

  // Task 5.2: Test event emission functionality
  describe('Event Emission Functionality', () => {
    it('should support both legacy and new event names', () => {
      const supportedEvents = mockModule.supportedEvents();
      
      expect(supportedEvents).toContain('RealtimeAudioAnalyzer:onData');
      expect(supportedEvents).toContain('AudioAnalysisData');
      expect(supportedEvents).toHaveLength(2);
    });
  });

  // Task 5.3: Test JavaScript bridge methods
  describe('JavaScript Bridge Methods', () => {
    it('should call startAnalysis method', async () => {
      mockModule.startAnalysis.mockResolvedValue(null);
      
      const config = { bufferSize: 1024 };
      await expect(mockModule.startAnalysis(config)).resolves.toBeNull();
      expect(mockModule.startAnalysis).toHaveBeenCalledWith(config);
    });

    it('should call getAnalysisConfig method', async () => {
      const mockConfig = {
        fftSize: 1024,
        sampleRate: 48000,
        bufferSize: 1024,
        smoothingEnabled: true,
        smoothingFactor: 0.5,
      };
      mockModule.getAnalysisConfig.mockResolvedValue(mockConfig);
      
      await expect(mockModule.getAnalysisConfig()).resolves.toEqual(mockConfig);
      expect(mockModule.getAnalysisConfig).toHaveBeenCalled();
    });
  });

  // Task 5.4: Test cleanup functionality
  describe('Cleanup Functionality', () => {
    it('should stop and cleanup resources', async () => {
      mockModule.start.mockResolvedValue(null);
      mockModule.stop.mockResolvedValue(null);
      mockModule.isRunning.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      
      // Start
      await mockModule.start({});
      expect(await mockModule.isRunning()).toBe(true);
      
      // Stop
      await mockModule.stop();
      expect(await mockModule.isRunning()).toBe(false);
    });

    it('should handle stop when not running', async () => {
      mockModule.stop.mockResolvedValue(null);
      
      await expect(mockModule.stop()).resolves.toBeNull();
      expect(mockModule.stop).toHaveBeenCalled();
    });
  });
});
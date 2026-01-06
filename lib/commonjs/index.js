import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// Get the native module - try both possible names
const RealtimeAudioAnalysisModule = NativeModules.RealtimeAudioAnalysis || NativeModules.RealtimeAudioAnalyzer;

if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(NativeModules).filter(key => key.includes('Audio') || key.includes('Realtime')));
  throw new Error(LINKING_ERROR);
}

export interface AnalysisConfig {
  fftSize?: number;
  sampleRate?: number;
  windowFunction?: 'hanning' | 'hamming' | 'blackman' | 'rectangular';
  smoothing?: number;
}

export interface AudioAnalysisEvent {
  frequencyData: number[];
  timeData: number[];
  volume: number;
  peak: number;
  timestamp: number;
  // Additional properties from native module
  rms?: number;
  fft?: number[];
}

// Create event emitter
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

// Debug: Log available methods
console.log('RealtimeAudioAnalysis native methods:', Object.keys(RealtimeAudioAnalysisModule));

const RealtimeAudioAnalyzer = {
  // Core methods
  startAnalysis(config?: AnalysisConfig): Promise<void> {
    console.log('Calling startAnalysis with config:', config);
    return RealtimeAudioAnalysisModule.startAnalysis(config || {});
  },

  stopAnalysis(): Promise<void> {
    console.log('Calling stopAnalysis');
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },

  isAnalyzing(): Promise<boolean> {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },

  getAnalysisConfig(): Promise<AnalysisConfig> {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },

  // Event emitter methods
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription: any) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;
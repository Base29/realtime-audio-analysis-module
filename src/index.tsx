import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const RealtimeAudioAnalysisModule = isTurboModuleEnabled
  ? require('./NativeRealtimeAudioAnalysis').default
  : NativeModules.RealtimeAudioAnalysis;

const RealtimeAudioAnalyzer = RealtimeAudioAnalysisModule
  ? RealtimeAudioAnalysisModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

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
}

export default {
  startAnalysis(config?: AnalysisConfig): Promise<void> {
    return RealtimeAudioAnalyzer.startAnalysis(config || {});
  },

  stopAnalysis(): Promise<void> {
    return RealtimeAudioAnalyzer.stopAnalysis();
  },

  isAnalyzing(): Promise<boolean> {
    return RealtimeAudioAnalyzer.isAnalyzing();
  },

  getAnalysisConfig(): Promise<AnalysisConfig> {
    return RealtimeAudioAnalyzer.getAnalysisConfig();
  },

  // Event emitter methods
  addListener: RealtimeAudioAnalyzer.addListener?.bind(RealtimeAudioAnalyzer),
  removeListeners: RealtimeAudioAnalyzer.removeListeners?.bind(RealtimeAudioAnalyzer),
};
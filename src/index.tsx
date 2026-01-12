import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import NativeRealtimeAudioAnalyzer, {
  type AnalysisConfig,
} from './NativeRealtimeAudioAnalyzer';

const LINKING_ERROR =
  `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

type NativeModuleShape = typeof NativeRealtimeAudioAnalyzer;

// Turbo-first. Fallback to legacy NativeModules (helps during migration / if turbo disabled)
const RealtimeAudioAnalysisModule: NativeModuleShape | undefined =
  (NativeRealtimeAudioAnalyzer as unknown as NativeModuleShape) ??
  (NativeModules.RealtimeAudioAnalyzer as NativeModuleShape | undefined);

if (!RealtimeAudioAnalysisModule) {
  console.error(
    'Available NativeModules:',
    Object.keys(NativeModules).filter(
      (key) => key.includes('Audio') || key.includes('Realtime')
    )
  );
  throw new Error(LINKING_ERROR);
}

export type { AnalysisConfig };

export interface AudioAnalysisEvent {
  frequencyData: number[];
  timeData: number[];
  volume: number;
  peak: number;
  timestamp: number;
  rms?: number;
  fft?: number[];
}

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule as any);

// Optional: keep debug log, but consider removing in production
// console.log('RealtimeAudioAnalyzer native methods:', Object.keys(RealtimeAudioAnalysisModule as any));

const RealtimeAudioAnalyzer = {
  startAnalysis(config: AnalysisConfig = {}): Promise<void> {
    return RealtimeAudioAnalysisModule.startAnalysis(config);
  },

  stopAnalysis(): Promise<void> {
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },

  isAnalyzing(): Promise<boolean> {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },

  getAnalysisConfig(): Promise<AnalysisConfig> {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },

  // Keep your emitter API consistent
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription: any) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;
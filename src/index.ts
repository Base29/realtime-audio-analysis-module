import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import NativeRealtimeAudioAnalyzer, {
  type AnalysisConfig,
  type Spec as TurboSpec,
} from './NativeRealtimeAudioAnalyzer';

const LINKING_ERROR =
  `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const legacyCandidateNames = [
  'RealtimeAudioAnalyzer', // expected (matches getName())
  'RealtimeAudioAnalyzerModule', // occasional legacy naming
] as const;

function getLegacyModule(): any | null {
  for (const name of legacyCandidateNames) {
    const m = (NativeModules as any)[name];
    if (m) return m;
  }
  return null;
}

// Turbo module can be null until Android is truly Turbo-registered
const turboModule: TurboSpec | null = (NativeRealtimeAudioAnalyzer ?? null) as TurboSpec | null;
const legacyModule: any | null = getLegacyModule();

// Prefer turbo when available, otherwise legacy
const RealtimeAudioAnalysisModule: any | null = turboModule ?? legacyModule;

if (!RealtimeAudioAnalysisModule) {
  console.error(
    'Available NativeModules:',
    Object.keys(NativeModules).filter(
      (key) =>
        key.includes('Audio') ||
        key.includes('Realtime') ||
        key.includes('Platform') ||
        key.includes('Constants')
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

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

const RealtimeAudioAnalyzer = {
  // Core methods
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

  // Backward-compatible aliases
  start(config: AnalysisConfig = {}): Promise<void> {
    const fn = RealtimeAudioAnalysisModule.start ?? RealtimeAudioAnalysisModule.startAnalysis;
    return fn(config);
  },

  stop(): Promise<void> {
    const fn = RealtimeAudioAnalysisModule.stop ?? RealtimeAudioAnalysisModule.stopAnalysis;
    return fn();
  },

  isRunning(): Promise<boolean> {
    const fn = RealtimeAudioAnalysisModule.isRunning ?? RealtimeAudioAnalysisModule.isAnalyzing;
    return fn();
  },

  // Event emitter API
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription: any) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;
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

const EVENT_ON_DATA = 'RealtimeAudioAnalyzer:onData';
const EVENT_COMPAT = 'AudioAnalysisData';

// NativeEventEmitter requires a module instance on iOS; safe to pass on Android too.
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule as any);

type Subscription = { remove: () => void };

/**
 * Backward-compatible listener:
 * - addListener(callback) -> listens to default EVENT_ON_DATA
 * - addListener(eventName, callback) -> listens to custom eventName
 *
 * This prevents: "2nd argument must be a function."
 */
function addListenerCompat(
  eventOrListener: string | ((e: AudioAnalysisEvent) => void),
  maybeListener?: (e: AudioAnalysisEvent) => void
): Subscription {
  // Style A: addListener(callback)
  if (typeof eventOrListener === 'function') {
    return eventEmitter.addListener(EVENT_ON_DATA, eventOrListener);
  }

  // Style B: addListener(eventName, callback)
  const eventName = eventOrListener;
  const listener = maybeListener;

  if (typeof listener !== 'function') {
    throw new TypeError(
      `RealtimeAudioAnalyzer.addListener(eventName, listener): listener must be a function`
    );
  }

  return eventEmitter.addListener(eventName, listener);
}

function removeListenersCompat(eventOrCount?: string | number) {
  // If user passes a specific event name
  if (typeof eventOrCount === 'string') {
    eventEmitter.removeAllListeners(eventOrCount);
    return;
  }

  // If user passes a count (RN's old EventEmitter signature)
  // We can't reliably remove by count; remove our known events safely.
  eventEmitter.removeAllListeners(EVENT_ON_DATA);
  eventEmitter.removeAllListeners(EVENT_COMPAT);
}

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

  // Recommended explicit subscription helper (does not break existing API)
  onData(listener: (e: AudioAnalysisEvent) => void): Subscription {
    if (typeof listener !== 'function') {
      throw new TypeError('RealtimeAudioAnalyzer.onData(listener): listener must be a function');
    }
    return eventEmitter.addListener(EVENT_ON_DATA, listener);
  },

  // Event emitter API (backward compatible + safer)
  addListener: addListenerCompat,
  removeListeners: removeListenersCompat,
  removeSubscription: (subscription: any) => subscription?.remove?.(),
};

export default RealtimeAudioAnalyzer;
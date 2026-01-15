import { type AnalysisConfig } from './NativeRealtimeAudioAnalyzer';
export { RichAudioDemo, SpectrumVisualizer, LevelMeter, useRealtimeAudioLevels, AudioPermissionManager, RingBuffer } from './demo';
export type { RichAudioDemoProps, SpectrumVisualizerProps, LevelMeterProps, AudioLevelsHook, PermissionStatus, AnalysisConfig as DemoAnalysisConfig } from './demo';
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
type Subscription = {
    remove: () => void;
};
/**
 * Backward-compatible listener:
 * - addListener(callback) -> listens to default EVENT_ON_DATA
 * - addListener(eventName, callback) -> listens to custom eventName
 *
 * This prevents: "2nd argument must be a function."
 */
declare function addListenerCompat(eventOrListener: string | ((e: AudioAnalysisEvent) => void), maybeListener?: (e: AudioAnalysisEvent) => void): Subscription;
declare function removeListenersCompat(eventOrCount?: string | number): void;
declare const RealtimeAudioAnalyzer: {
    startAnalysis(config?: AnalysisConfig): Promise<void>;
    stopAnalysis(): Promise<void>;
    isAnalyzing(): Promise<boolean>;
    getAnalysisConfig(): Promise<AnalysisConfig>;
    setSmoothing(enabled: boolean, factor: number): Promise<void>;
    setFftConfig(fftSize: number, downsampleBins: number): Promise<void>;
    start(config?: AnalysisConfig): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
    onData(listener: (e: AudioAnalysisEvent) => void): Subscription;
    addListener: typeof addListenerCompat;
    removeListeners: typeof removeListenersCompat;
    removeSubscription: (subscription: any) => any;
};
export default RealtimeAudioAnalyzer;

import { type AnalysisConfig } from './NativeRealtimeAudioAnalyzer';
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
declare const RealtimeAudioAnalyzer: {
    startAnalysis(config?: AnalysisConfig): Promise<void>;
    stopAnalysis(): Promise<void>;
    isAnalyzing(): Promise<boolean>;
    getAnalysisConfig(): Promise<AnalysisConfig>;
    start(config?: AnalysisConfig): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
    addListener: (eventType: string, listener: (event: any) => void, context?: Object) => import("react-native").EmitterSubscription;
    removeListeners: (eventType: string) => void;
    removeSubscription: (subscription: any) => any;
};
export default RealtimeAudioAnalyzer;

export interface AudioAnalysisEvent {
    timestamp: number;
    rms: number;
    peak: number;
    fft: number[];
    sampleRate: number;
    bufferSize: number;
}
export interface StartOptions {
    bufferSize?: number;
    sampleRate?: number;
    callbackRateHz?: number;
    emitFft?: boolean;
}
export declare const RealtimeAudioAnalyzer: {
    start(options?: StartOptions): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
    setSmoothing(enabled: boolean, factor?: number): Promise<void>;
    setFftConfig(fftSize: number, downsampleBins?: number): Promise<void>;
    addListener(callback: (event: AudioAnalysisEvent) => void): import("react-native").EmitterSubscription;
    removeAllListeners(): void;
};
//# sourceMappingURL=index.d.ts.map
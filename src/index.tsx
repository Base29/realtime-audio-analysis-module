import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
    `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';

const RealtimeAudioAnalyzerModule = NativeModules.RealtimeAudioAnalyzer
    ? NativeModules.RealtimeAudioAnalyzer
    : new Proxy(
        {},
        {
            get() {
                throw new Error(LINKING_ERROR);
            },
        }
    );

export interface AudioAnalysisEvent {
    timestamp: number;
    rms: number;
    peak: number;
    fft: number[];
    sampleRate: number;
    bufferSize: number;
}

export interface StartOptions {
    bufferSize?: number; // default 1024
    sampleRate?: number; // preferred, default 44100
    callbackRateHz?: number; // default 30
    emitFft?: boolean; // default true
}

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzerModule);

export const RealtimeAudioAnalyzer = {
    start(options: StartOptions = {}): Promise<void> {
        return RealtimeAudioAnalyzerModule.start(options);
    },

    stop(): Promise<void> {
        return RealtimeAudioAnalyzerModule.stop();
    },

    isRunning(): Promise<boolean> {
        return RealtimeAudioAnalyzerModule.isRunning();
    },

    setSmoothing(enabled: boolean, factor: number = 0.5): Promise<void> {
        return RealtimeAudioAnalyzerModule.setSmoothing(enabled, factor);
    },

    setFftConfig(fftSize: number, downsampleBins: number = -1): Promise<void> {
        return RealtimeAudioAnalyzerModule.setFftConfig(fftSize, downsampleBins);
    },

    addListener(callback: (event: AudioAnalysisEvent) => void) {
        return eventEmitter.addListener('RealtimeAudioAnalyzer:onData', callback);
    },

    removeAllListeners() {
        eventEmitter.removeAllListeners('RealtimeAudioAnalyzer:onData');
    },
};

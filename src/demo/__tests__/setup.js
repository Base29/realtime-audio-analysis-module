/**
 * Test setup for Rich Audio Demo property-based testing
 * Configures fast-check and Jest for comprehensive testing
 */
import fc from 'fast-check';
// Configure fast-check for property-based testing
fc.configureGlobal({
    numRuns: 100, // Minimum 100 iterations per property test as specified in design
    verbose: true,
    seed: 42, // Fixed seed for reproducible tests
});
// Mock React Native modules for testing environment
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
        select: jest.fn((options) => options.ios || options.default),
    },
    PermissionsAndroid: {
        PERMISSIONS: {
            RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
        },
        RESULTS: {
            GRANTED: 'granted',
            DENIED: 'denied',
            NEVER_ASK_AGAIN: 'never_ask_again',
        },
        check: jest.fn(),
        request: jest.fn(),
    },
    Linking: {
        openSettings: jest.fn(),
    },
    NativeEventEmitter: jest.fn(() => ({
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        removeAllListeners: jest.fn(),
    })),
    NativeModules: {},
}));
// Mock the main RealtimeAudioAnalyzer module
jest.mock('../../index', () => ({
    startAnalysis: jest.fn(),
    stopAnalysis: jest.fn(),
    isAnalyzing: jest.fn(),
    getAnalysisConfig: jest.fn(),
    onData: jest.fn(() => ({ remove: jest.fn() })),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListeners: jest.fn(),
}));
global.createMockAudioEvent = (overrides = {}) => ({
    frequencyData: new Array(32).fill(0).map(() => Math.random()),
    timeData: new Array(1024).fill(0).map(() => Math.random() * 2 - 1),
    volume: Math.random(),
    peak: Math.random(),
    timestamp: Date.now(),
    ...overrides,
});
// Property-based test generators
export const audioDataArbitrary = fc.record({
    frequencyData: fc.array(fc.float({ min: 0, max: 1 }), { minLength: 1, maxLength: 4096 }),
    timeData: fc.array(fc.float({ min: -1, max: 1 }), { minLength: 1, maxLength: 8192 }),
    volume: fc.float({ min: 0, max: 1 }),
    peak: fc.float({ min: 0, max: 1 }),
    timestamp: fc.integer({ min: 0 }),
});
export const permissionStatusArbitrary = fc.constantFrom('granted', 'denied', 'undetermined', 'blocked');
export const analysisConfigArbitrary = fc.record({
    fftSize: fc.constantFrom(512, 1024, 2048, 4096),
    sampleRate: fc.constantFrom(44100, 48000),
    windowFunction: fc.constantFrom('hanning', 'hamming', 'blackman', 'rectangular'),
    smoothing: fc.float({ min: 0, max: 1 }),
}, { requiredKeys: [] });
export const richAudioDemoPropsArbitrary = fc.record({
    autoStart: fc.boolean(),
    showDebug: fc.boolean(),
    barCount: fc.integer({ min: 8, max: 128 }),
    onError: fc.constant(jest.fn()),
}, { requiredKeys: [] });

// Simple test to prevent Jest "no tests" error
describe('Test Setup', () => {
    it('should configure fast-check properly', () => {
        expect(fc).toBeDefined();
        expect(global.createMockAudioEvent).toBeDefined();
    });
});

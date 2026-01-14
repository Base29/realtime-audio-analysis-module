import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioPermissionManager } from '../utils/PermissionManager';
import RealtimeAudioAnalyzer from '../../index';
/**
 * Custom hook for managing realtime audio analysis lifecycle and data
 * Provides permission handling, audio data, configuration, and controls
 *
 * Features:
 * - Idempotent event subscription management
 * - Automatic cleanup on unmount
 * - Throttled updates for performance
 * - Configuration persistence across start/stop cycles
 * - Cross-platform permission handling
 */
export function useRealtimeAudioLevels() {
    // Permission state
    const [permissionStatus, setPermissionStatus] = useState('undetermined');
    // Audio data
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rms, setRms] = useState(0);
    const [peak, setPeak] = useState(0);
    const [rmsSmoothed, setRmsSmoothed] = useState(0);
    const [peakSmoothed, setPeakSmoothed] = useState(0);
    const [frequencyData, setFrequencyData] = useState([]);
    // Configuration state
    const [sampleRate, setSampleRate] = useState(44100);
    const [fftSize, setFftSize] = useState(1024);
    const [smoothingEnabled, setSmoothingEnabled] = useState(false);
    const [smoothingFactor, setSmoothingFactor] = useState(0.8);
    // Error handling
    const [error, setError] = useState(null);
    // Refs for lifecycle management and performance
    const subscriptionRef = useRef(null);
    const permissionManagerRef = useRef(new AudioPermissionManager());
    const lastUpdateRef = useRef(0);
    const throttleIntervalRef = useRef(16); // ~60 FPS throttling
    // Configuration persistence - store last used config
    const persistedConfigRef = useRef({
        fftSize: 1024,
        sampleRate: 44100,
        smoothing: 0,
    });
    // Track subscription state to ensure idempotency
    const isSubscribedRef = useRef(false);
    // Check permission on mount
    useEffect(() => {
        const checkInitialPermission = async () => {
            try {
                const status = await permissionManagerRef.current.checkPermission();
                setPermissionStatus(status);
            }
            catch (err) {
                setError('Failed to check permission status');
                console.warn('Permission check error:', err);
            }
        };
        checkInitialPermission();
    }, []);
    // Cleanup on unmount - ensure all resources are properly released
    useEffect(() => {
        return () => {
            // Remove subscription first to prevent any final events
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
            // Stop analysis and ignore any errors during cleanup
            RealtimeAudioAnalyzer.stopAnalysis().catch(() => {
                // Ignore cleanup errors - component is unmounting
            });
        };
    }, []);
    const requestPermission = useCallback(async () => {
        try {
            const granted = await permissionManagerRef.current.requestPermission();
            const newStatus = granted ? 'granted' : 'denied';
            setPermissionStatus(newStatus);
            return granted;
        }
        catch (err) {
            setError('Failed to request permission');
            console.warn('Permission request error:', err);
            return false;
        }
    }, []);
    const handleAudioData = useCallback((event) => {
        // Throttle updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleIntervalRef.current) {
            return;
        }
        lastUpdateRef.current = now;
        // Extract audio data from event, handling different field names for compatibility
        const currentRms = event.volume || event.rms || 0;
        const currentPeak = event.peak || 0;
        const currentFrequencyData = event.frequencyData || event.fft || [];
        // Update raw audio data
        setRms(currentRms);
        setPeak(currentPeak);
        setFrequencyData(currentFrequencyData);
        // Apply smoothing if enabled, otherwise use raw values
        if (smoothingEnabled && smoothingFactor > 0) {
            // Simple exponential smoothing for now
            // This will be enhanced when native smoothing is available
            setRmsSmoothed(prev => prev * smoothingFactor + currentRms * (1 - smoothingFactor));
            setPeakSmoothed(prev => prev * smoothingFactor + currentPeak * (1 - smoothingFactor));
        }
        else {
            setRmsSmoothed(currentRms);
            setPeakSmoothed(currentPeak);
        }
    }, [smoothingEnabled, smoothingFactor]);
    const startAnalysis = useCallback(async (config = {}) => {
        try {
            setError(null);
            // Check permission first
            if (permissionStatus !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    throw new Error('Microphone permission required');
                }
            }
            // Merge with persisted configuration for consistency across start/stop cycles
            const finalConfig = {
                ...persistedConfigRef.current,
                ...config,
            };
            // Remove existing subscription to prevent duplicates (idempotent subscription management)
            if (subscriptionRef.current && isSubscribedRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
            // Start analysis with final configuration
            await RealtimeAudioAnalyzer.startAnalysis(finalConfig);
            // Subscribe to audio data events (idempotent - only one subscription at a time)
            if (!isSubscribedRef.current) {
                subscriptionRef.current = RealtimeAudioAnalyzer.onData(handleAudioData);
                isSubscribedRef.current = true;
            }
            setIsAnalyzing(true);
            // Update configuration state and persist for future start/stop cycles
            if (finalConfig.fftSize) {
                setFftSize(finalConfig.fftSize);
                persistedConfigRef.current.fftSize = finalConfig.fftSize;
            }
            if (finalConfig.sampleRate) {
                setSampleRate(finalConfig.sampleRate);
                persistedConfigRef.current.sampleRate = finalConfig.sampleRate;
            }
            if (finalConfig.smoothing !== undefined) {
                const enabled = finalConfig.smoothing > 0;
                setSmoothingEnabled(enabled);
                setSmoothingFactor(finalConfig.smoothing);
                persistedConfigRef.current.smoothing = finalConfig.smoothing;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
            setError(errorMessage);
            setIsAnalyzing(false);
            // Clean up subscription on error
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
            throw err;
        }
    }, [permissionStatus, requestPermission, handleAudioData]);
    const stopAnalysis = useCallback(async () => {
        try {
            // Stop the native analysis first
            await RealtimeAudioAnalyzer.stopAnalysis();
            // Remove event subscription
            if (subscriptionRef.current && isSubscribedRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
            setIsAnalyzing(false);
            // Reset audio data to clean state
            setRms(0);
            setPeak(0);
            setRmsSmoothed(0);
            setPeakSmoothed(0);
            setFrequencyData([]);
            // Note: Configuration is preserved in persistedConfigRef for next start
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to stop analysis';
            setError(errorMessage);
            // Even if stop fails, clean up our local state
            setIsAnalyzing(false);
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
                isSubscribedRef.current = false;
            }
            throw err;
        }
    }, []);
    const setSmoothing = useCallback(async (enabled, factor) => {
        try {
            // Validate smoothing factor
            const clampedFactor = Math.max(0, Math.min(1, factor));
            setSmoothingEnabled(enabled);
            setSmoothingFactor(clampedFactor);
            // Update persisted configuration
            persistedConfigRef.current.smoothing = enabled ? clampedFactor : 0;
            // TODO: Call native setSmoothing when available
            await RealtimeAudioAnalyzer.setSmoothing(enabled, clampedFactor);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set smoothing';
            setError(errorMessage);
            throw err;
        }
    }, []);
    const setFftConfig = useCallback(async (newFftSize, downsampleBins) => {
        try {
            // Validate FFT size (must be power of 2)
            const validFftSizes = [256, 512, 1024, 2048, 4096, 8192];
            const validatedFftSize = validFftSizes.includes(newFftSize) ? newFftSize : 1024;
            setFftSize(validatedFftSize);
            // Update persisted configuration
            persistedConfigRef.current.fftSize = validatedFftSize;
            // TODO: Call native setFftConfig when available
            await RealtimeAudioAnalyzer.setFftConfig(validatedFftSize, downsampleBins);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set FFT config';
            setError(errorMessage);
            throw err;
        }
    }, []);
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    return {
        // Permission state
        permissionStatus,
        requestPermission,
        // Audio data
        isAnalyzing,
        rms,
        peak,
        rmsSmoothed,
        peakSmoothed,
        frequencyData,
        // Configuration
        sampleRate,
        fftSize,
        smoothingEnabled,
        smoothingFactor,
        // Controls
        startAnalysis,
        stopAnalysis,
        setSmoothing,
        setFftConfig,
        // Error handling
        error,
        clearError,
    };
}

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Dimensions, SafeAreaView, Alert, } from 'react-native';
import { NativeEventEmitter } from 'react-native';
// Import the module with error handling like SimpleAudioTest.js
let RealtimeAudioAnalyzer;
try {
    RealtimeAudioAnalyzer = require('../src/index').default;
    console.log('✅ Module imported successfully');
}
catch (error) {
    console.error('❌ Module import failed:', error);
}
// Configuration
const FFT_SIZE = 1024;
const BAR_COUNT = 32; // Number of bars to display
const { width: SCREEN_WIDTH } = Dimensions.get('window');
/**
 * A reusable Audio Visualizer component.
 *
 * Features:
 * - Real-time frequency spectrum (Bar Chart)
 * - RMS Volume Indicator (Pulsing Circle)
 * - Start/Stop Controls
 * - Auto-permission handling
 */
export const AudioVisualizer = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fftData, setFftData] = useState(new Array(BAR_COUNT).fill(0));
    const [rms, setRms] = useState(0);
    const [peak, setPeak] = useState(0);
    const [error, setError] = useState(null);
    const onAudioData = useCallback((data) => {
        console.log('Received audio data:', data);
        setRms(data.rms || data.volume || 0);
        setPeak(data.peak || 0);
        // Use frequencyData (mapped from native fft) or fallback to fft for compatibility
        const fftArray = data.frequencyData || data.fft;
        if (fftArray && fftArray.length > 0) {
            // Downsample to BAR_COUNT if needed
            if (fftArray.length > BAR_COUNT) {
                const step = Math.floor(fftArray.length / BAR_COUNT);
                const downsampled = [];
                for (let i = 0; i < BAR_COUNT; i++) {
                    downsampled.push(fftArray[i * step]);
                }
                setFftData(downsampled);
            }
            else {
                setFftData(fftArray.slice(0, BAR_COUNT));
            }
        }
    }, []);
    useEffect(() => {
        if (RealtimeAudioAnalyzer) {
            const emitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
            const subscription = emitter.addListener('AudioAnalysisData', onAudioData);
            return () => {
                subscription.remove();
            };
        }
        return undefined;
    }, [onAudioData]);
    const requestPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
                    title: 'Microphone Permission',
                    message: 'This app needs access to your microphone for audio analysis',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                });
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };
    const startAnalysis = async () => {
        try {
            setError(null);
            if (!RealtimeAudioAnalyzer) {
                throw new Error('RealtimeAudioAnalyzer module not found. Check linking.');
            }
            console.log('Requesting microphone permission...');
            const hasPermission = await requestPermission();
            if (!hasPermission) {
                throw new Error('Microphone permission denied');
            }
            console.log('Starting audio analysis...');
            await RealtimeAudioAnalyzer.startAnalysis({
                fftSize: FFT_SIZE,
                sampleRate: 48000, // Use 48kHz like the native improvements
            });
            setIsAnalyzing(true);
            console.log('✅ Audio analysis started successfully');
        }
        catch (err) {
            console.error('❌ Failed to start analysis:', err);
            setError(err.message);
            Alert.alert('Error', `Failed to start analysis: ${err.message}`);
            setIsAnalyzing(false);
        }
    };
    const stopAnalysis = async () => {
        try {
            if (!RealtimeAudioAnalyzer) {
                throw new Error('RealtimeAudioAnalyzer module not found');
            }
            console.log('Stopping audio analysis...');
            await RealtimeAudioAnalyzer.stopAnalysis();
            setIsAnalyzing(false);
            // Reset visuals like SimpleAudioTest.js
            setRms(0);
            setPeak(0);
            setFftData(new Array(BAR_COUNT).fill(0));
            console.log('✅ Audio analysis stopped');
        }
        catch (err) {
            console.error('❌ Failed to stop analysis:', err);
            setError(err.message);
            Alert.alert('Error', `Failed to stop analysis: ${err.message}`);
        }
    };
    const testModule = () => {
        if (!RealtimeAudioAnalyzer) {
            Alert.alert('Module Error', 'RealtimeAudioAnalyzer is not available. Check linking.');
            return;
        }
        const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing'];
        const availableMethods = methods.filter(method => typeof RealtimeAudioAnalyzer[method] === 'function');
        Alert.alert('Module Status', `Module is available!\nMethods found: ${availableMethods.join(', ')}`);
    };
    // --- Render Helpers ---
    const renderBars = () => {
        const barWidth = (SCREEN_WIDTH - 40) / BAR_COUNT - 2; // Spacing logic
        return (React.createElement(View, { style: styles.spectrumContainer }, fftData.map((magnitude, index) => {
            // Amplify low signals for better visibility
            const height = Math.min(magnitude * 250, 200);
            // Color gradient logic based on index or height
            const green = 255 - (index / BAR_COUNT) * 100;
            const blue = (index / BAR_COUNT) * 255;
            const color = `rgba(0, ${green}, ${blue}, 1)`;
            return (React.createElement(View, { key: index, style: [
                    styles.bar,
                    {
                        width: barWidth,
                        height: Math.max(height, 2), // Min height
                        backgroundColor: color,
                    },
                ] }));
        })));
    };
    return (React.createElement(SafeAreaView, { style: styles.container },
        React.createElement(Text, { style: styles.title }, "Real-Time Audio Analyzer"),
        error && (React.createElement(View, { style: styles.errorContainer },
            React.createElement(Text, { style: styles.errorText }, error))),
        React.createElement(View, { style: styles.statusContainer },
            React.createElement(Text, { style: styles.statusText },
                "Module Status: ",
                RealtimeAudioAnalyzer ? '✅ Available' : '❌ Not Found'),
            React.createElement(Text, { style: styles.statusText },
                "Analysis: ",
                isAnalyzing ? '🎤 Recording' : '⏹ Stopped')),
        React.createElement(View, { style: styles.meterContainer },
            React.createElement(View, { style: [
                    styles.rmsCircle,
                    {
                        // Scale circle by RMS (0.0 - 1.0)
                        transform: [{ scale: 1 + rms * 3 }], // Amplify for visual effect
                        opacity: 0.3 + peak * 0.7,
                    },
                ] }),
            React.createElement(Text, { style: styles.statText },
                "RMS: ",
                rms.toFixed(3)),
            React.createElement(Text, { style: styles.statText },
                "Peak: ",
                peak.toFixed(3))),
        renderBars(),
        React.createElement(View, { style: styles.controls },
            React.createElement(TouchableOpacity, { style: [styles.button, styles.testBtn], onPress: testModule },
                React.createElement(Text, { style: styles.btnText }, "Test Module")),
            !isAnalyzing ? (React.createElement(TouchableOpacity, { style: [
                    styles.button,
                    styles.startBtn,
                    !RealtimeAudioAnalyzer && styles.disabledButton
                ], onPress: startAnalysis, disabled: !RealtimeAudioAnalyzer },
                React.createElement(Text, { style: styles.btnText }, "START"))) : (React.createElement(TouchableOpacity, { style: [styles.button, styles.stopBtn], onPress: stopAnalysis },
                React.createElement(Text, { style: styles.btnText }, "STOP"))))));
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 20,
    },
    meterContainer: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    rmsCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#00ffaa',
        position: 'absolute',
    },
    statText: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 100, // Push below circle
    },
    spectrumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: 200,
        width: '100%',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        marginBottom: 30,
    },
    bar: {
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        marginHorizontal: 1,
    },
    controls: {
        flexDirection: 'column',
        marginTop: 20,
        gap: 10,
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        minWidth: 150,
        alignItems: 'center',
    },
    startBtn: {
        backgroundColor: '#00ffaa',
        shadowColor: '#00ffaa',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    stopBtn: {
        backgroundColor: '#ff4444',
    },
    testBtn: {
        backgroundColor: '#2196f3',
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorContainer: {
        backgroundColor: '#ff4444',
        padding: 10,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 5,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
    statusContainer: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 5,
    },
    disabledButton: {
        backgroundColor: '#666',
        opacity: 0.5,
    },
});

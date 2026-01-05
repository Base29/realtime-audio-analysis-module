package com.realtimeaudio

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.modules.core.DeviceEventManagerModule

class RealtimeAudioAnalyzerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val engine = AudioEngine { data -> sendEvent(data) }

    override fun getName(): String {
        return "RealtimeAudioAnalysis"  // Changed to match JavaScript expectation
    }

    // Add the methods that JavaScript expects
    @ReactMethod
    fun startAnalysis(config: ReadableMap, promise: Promise) {
        try {
            val bufferSize = if (config.hasKey("fftSize")) config.getInt("fftSize") else 1024
            val sampleRate = if (config.hasKey("sampleRate")) config.getInt("sampleRate") else 44100
            val callbackRateHz = 30 // Default callback rate
            val emitFft = true

            engine.start(bufferSize, sampleRate, callbackRateHz, emitFft)
            promise.resolve(null)
        } catch (e: SecurityException) {
            promise.reject("E_PERMISSION_DENIED", "Microphone permission denied: ${e.message}", e)
        } catch (e: Exception) {
            val errorMessage = e.message ?: "Unknown error occurred"
            promise.reject("E_START_FAILED", errorMessage, e)
        }
    }

    @ReactMethod
    fun stopAnalysis(promise: Promise) {
        engine.stop()
        promise.resolve(null)
    }

    @ReactMethod
    fun isAnalyzing(promise: Promise) {
        promise.resolve(engine.isRecording())
    }

    @ReactMethod
    fun getAnalysisConfig(promise: Promise) {
        val config = Arguments.createMap().apply {
            putInt("fftSize", 1024)
            putInt("sampleRate", 44100)
            putString("windowFunction", "hanning")
            putDouble("smoothing", 0.8)
        }
        promise.resolve(config)
    }

    // Keep the original methods for backward compatibility
    @ReactMethod
    fun start(options: ReadableMap, promise: Promise) {
        startAnalysis(options, promise)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        stopAnalysis(promise)
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        isAnalyzing(promise)
    }

    @ReactMethod
    fun setSmoothing(enabled: Boolean, factor: Float, promise: Promise) {
        engine.setSmoothing(enabled, factor)
        promise.resolve(null)
    }

    @ReactMethod
    fun setFftConfig(fftSize: Int, downsampleBins: Int, promise: Promise) {
        engine.setFftConfig(fftSize, downsampleBins)
        promise.resolve(null)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in EventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in EventEmitter
    }

    private fun sendEvent(data: AudioEngine.AudioData) {
        if (!reactApplicationContext.hasActiveCatalystInstance()) return

        val params = Arguments.createMap().apply {
            putDouble("timestamp", data.timestamp)
            putDouble("volume", data.rms)  // Map rms to volume for consistency
            putDouble("peak", data.peak)
            putInt("sampleRate", data.sampleRate)
            putInt("fftSize", data.bufferSize)  // Map bufferSize to fftSize

            if (data.fft != null) {
                val fftArray = Arguments.createArray()
                for (value in data.fft) {
                    fftArray.pushDouble(value.toDouble())
                }
                putArray("frequencyData", fftArray)  // Map fft to frequencyData
                putArray("timeData", Arguments.createArray())  // Add empty timeData for now
            } else {
                putArray("frequencyData", Arguments.createArray())
                putArray("timeData", Arguments.createArray())
            }
        }

        // Send to both event names for compatibility
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AudioAnalysisData", params)
            
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("RealtimeAudioAnalyzer:onData", params)
    }
}

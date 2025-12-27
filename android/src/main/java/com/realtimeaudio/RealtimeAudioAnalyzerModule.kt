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
        return "RealtimeAudioAnalyzer"
    }

    @ReactMethod
    fun start(options: ReadableMap, promise: Promise) {
        // Permissions check
        try {
            // Note: Modern RN has PermissionAndroid, but native checks good too
            // Assuming Permission is granted by JS layer check or App manifest
            
            val bufferSize = if (options.hasKey("bufferSize")) options.getInt("bufferSize") else 1024
            val sampleRate = if (options.hasKey("sampleRate")) options.getInt("sampleRate") else 44100
            val callbackRateHz = if (options.hasKey("callbackRateHz")) options.getInt("callbackRateHz") else 30
            val emitFft = if (options.hasKey("emitFft")) options.getBoolean("emitFft") else true

            engine.start(bufferSize, sampleRate, callbackRateHz, emitFft)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("E_START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        engine.stop()
        promise.resolve(null)
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(engine.isRecording())
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
            putDouble("rms", data.rms)
            putDouble("peak", data.peak)
            putInt("sampleRate", data.sampleRate)
            putInt("bufferSize", data.bufferSize)

            if (data.fft != null) {
                val fftArray = Arguments.createArray()
                for (value in data.fft) {
                    fftArray.pushDouble(value.toDouble())
                }
                putArray("fft", fftArray)
            } else {
                putArray("fft", Arguments.createArray())
            }
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("RealtimeAudioAnalyzer:onData", params)
    }
}

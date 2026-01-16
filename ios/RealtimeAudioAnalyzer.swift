import Foundation
import AVFoundation
import Accelerate
import React
import os.log

@objc(RealtimeAudioAnalyzer)
class RealtimeAudioAnalyzer: RCTEventEmitter {

  private var audioEngine: AVAudioEngine?
  private var bus = 0
  private var running = false
  
  // Debug logging
  private static let logger = OSLog(subsystem: "com.realtimeaudio", category: "RealtimeAudioAnalyzer")
  private var debugLoggingEnabled: Bool = false

  // Config
  private var bufferSize: UInt32 = 1024
  private var targetSampleRate: Double = 48000.0
  private var callbackRateHz: Double = 30.0
  private var emitFft: Bool = true
  private var smoothingEnabled: Bool = true
  private var smoothingFactor: Float = 0.5
  private var fftSize: Int = 1024
  private var downsampleBins: Int = -1

  // FFT state
  private var fftSetup: vDSP_DFT_Setup?
  private var logN: vDSP_Length = 10
  private var lastCallbackTime: TimeInterval = 0
  private var smoothRms: Float = 0
  private var smoothPeak: Float = 0

  // Pre-allocated buffers (avoid allocation in callback as much as possible)
  private var window: [Float] = []
  private var windowedInput: [Float] = []
  private var fftReal: [Float] = []
  private var fftImag: [Float] = []
  private var zerosImag: [Float] = []
  private var magnitudes: [Float] = []

  // MARK: - Error Handling and Logging Utilities
  
  private func logMethodCall(_ methodName: String, parameters: [String: Any]? = nil) {
    guard debugLoggingEnabled else { return }
    
    var logMessage = "Method called: \(methodName)"
    if let params = parameters {
      logMessage += " with parameters: \(params)"
    }
    
    os_log("%{public}@", log: Self.logger, type: .info, logMessage)
  }
  
  private func logMethodResult(_ methodName: String, success: Bool, error: String? = nil) {
    guard debugLoggingEnabled else { return }
    
    let status = success ? "SUCCESS" : "FAILED"
    var logMessage = "Method \(methodName) result: \(status)"
    if let errorMsg = error {
      logMessage += " - Error: \(errorMsg)"
    }
    
    os_log("%{public}@", log: Self.logger, type: success ? .info : .error, logMessage)
  }
  
  private func validateConfigParameter(_ config: NSDictionary?) -> (isValid: Bool, error: String?) {
    guard let config = config else {
      return (false, "Configuration parameter cannot be nil")
    }
    
    // Validate fftSize if provided
    if let fftSizeValue = config["fftSize"] as? NSNumber {
      let fftSizeInt = fftSizeValue.intValue
      if fftSizeInt < 64 || fftSizeInt > 16384 {
        return (false, "fftSize must be between 64 and 16384, got: \(fftSizeInt)")
      }
      // Check if it's a power of 2 for optimal FFT performance
      if fftSizeInt & (fftSizeInt - 1) != 0 {
        os_log("Warning: fftSize %d is not a power of 2, performance may be suboptimal", log: Self.logger, type: .default, fftSizeInt)
      }
    }
    
    // Validate sampleRate if provided
    if let sampleRate = config["sampleRate"] as? NSNumber {
      let rate = sampleRate.doubleValue
      if rate < 8000 || rate > 96000 {
        return (false, "sampleRate must be between 8000 and 96000 Hz, got: \(rate)")
      }
    }
    
    // Validate smoothing if provided
    if let smoothing = config["smoothing"] as? NSNumber {
      let smoothingValue = smoothing.doubleValue
      if smoothingValue < 0 || smoothingValue > 1 {
        return (false, "smoothing must be between 0.0 and 1.0, got: \(smoothingValue)")
      }
    }
    
    // Validate bufferSize if provided
    if let bufferSize = config["bufferSize"] as? NSNumber {
      let bufSize = bufferSize.intValue
      if bufSize < 256 || bufSize > 8192 {
        return (false, "bufferSize must be between 256 and 8192, got: \(bufSize)")
      }
    }
    
    // Validate callbackRateHz if provided
    if let callbackRate = config["callbackRateHz"] as? NSNumber {
      let rate = callbackRate.doubleValue
      if rate < 1 || rate > 120 {
        return (false, "callbackRateHz must be between 1 and 120, got: \(rate)")
      }
    }
    
    // Validate downsampleBins if provided
    if let downsampleBins = config["downsampleBins"] as? NSNumber {
      let bins = downsampleBins.intValue
      if bins != -1 && bins <= 0 {
        return (false, "downsampleBins must be -1 (disabled) or a positive integer, got: \(bins)")
      }
    }
    
    return (true, nil)
  }
  
  private func validateSmoothingParameters(enabled: Bool, factor: NSNumber?) -> (isValid: Bool, error: String?) {
    guard let factor = factor else {
      return (false, "Smoothing factor parameter cannot be nil")
    }
    
    let factorValue = factor.floatValue
    if factorValue < 0.0 || factorValue > 1.0 {
      return (false, "Smoothing factor must be between 0.0 and 1.0, got: \(factorValue)")
    }
    
    if enabled && factorValue == 0.0 {
      os_log("Warning: smoothing enabled but factor is 0.0, no smoothing will be applied", log: Self.logger, type: .default)
    }
    
    return (true, nil)
  }
  
  private func validateFftConfigParameters(fftSize: NSNumber?, downsampleBins: NSNumber?) -> (isValid: Bool, error: String?) {
    guard let fftSize = fftSize else {
      return (false, "FFT size parameter cannot be nil")
    }
    
    guard let downsampleBins = downsampleBins else {
      return (false, "Downsample bins parameter cannot be nil")
    }
    
    let fftSizeInt = fftSize.intValue
    let downsampleBinsInt = downsampleBins.intValue
    
    // Validate fftSize
    if fftSizeInt < 64 || fftSizeInt > 16384 {
      return (false, "FFT size must be between 64 and 16384, got: \(fftSizeInt)")
    }
    
    // Check if it's a power of 2
    if fftSizeInt & (fftSizeInt - 1) != 0 {
      os_log("Warning: fftSize %d is not a power of 2, performance may be suboptimal", log: Self.logger, type: .default, fftSizeInt)
    }
    
    // Validate downsampleBins
    if downsampleBinsInt != -1 && (downsampleBinsInt <= 0 || downsampleBinsInt > fftSizeInt / 2) {
      return (false, "Downsample bins must be -1 (disabled) or between 1 and \(fftSizeInt / 2), got: \(downsampleBinsInt)")
    }
    
    return (true, nil)
  }
  
  private func handleAudioEngineError(_ error: Error, operation: String) -> (code: String, message: String) {
    let nsError = error as NSError
    
    switch nsError.code {
    case AVAudioSession.ErrorCode.cannotStartPlaying.rawValue:
      return ("E_AUDIO_SESSION_START_FAILED", "Cannot start audio session for \(operation): \(error.localizedDescription)")
    case AVAudioSession.ErrorCode.cannotStartRecording.rawValue:
      return ("E_AUDIO_SESSION_RECORD_FAILED", "Cannot start recording for \(operation): \(error.localizedDescription)")
    case AVAudioSession.ErrorCode.resourceNotAvailable.rawValue:
      return ("E_AUDIO_RESOURCE_UNAVAILABLE", "Audio resource not available for \(operation): \(error.localizedDescription)")
    case AVAudioSession.ErrorCode.incompatibleCategory.rawValue:
      return ("E_AUDIO_CATEGORY_INCOMPATIBLE", "Incompatible audio category for \(operation): \(error.localizedDescription)")
    default:
      // Check for AVAudioEngine specific errors
      if nsError.domain == NSOSStatusErrorDomain {
        switch OSStatus(nsError.code) {
        case kAudioUnitErr_InvalidProperty:
          return ("E_AUDIO_ENGINE_INVALID_PROPERTY", "Invalid audio engine property for \(operation): \(error.localizedDescription)")
        case kAudioUnitErr_PropertyNotWritable:
          return ("E_AUDIO_ENGINE_PROPERTY_NOT_WRITABLE", "Audio engine property not writable for \(operation): \(error.localizedDescription)")
        case kAudioUnitErr_InvalidParameter:
          return ("E_AUDIO_ENGINE_INVALID_PARAMETER", "Invalid audio engine parameter for \(operation): \(error.localizedDescription)")
        case kAudioUnitErr_NoConnection:
          return ("E_AUDIO_ENGINE_NO_CONNECTION", "No audio engine connection for \(operation): \(error.localizedDescription)")
        default:
          return ("E_AUDIO_ENGINE_ERROR", "Audio engine error for \(operation) (code: \(nsError.code)): \(error.localizedDescription)")
        }
      }
      
      return ("E_UNKNOWN_AUDIO_ERROR", "Unknown audio error for \(operation): \(error.localizedDescription)")
    }
  }

  // MARK: - RN Module Plumbing (Swift-safe overrides)

  // ✅ Fix 1: moduleName must be override in Swift (RN already defines it)
  @objc override class func moduleName() -> String! {
    return "RealtimeAudioAnalyzer"
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["RealtimeAudioAnalyzer:onData", "AudioAnalysisData"]
  }

  // ✅ Fix 2: In many RN versions this is a *property*, not a method.
  // If your RN version doesn't expose it to Swift, just delete this override.
  @objc override var methodQueue: DispatchQueue! {
    return DispatchQueue.global(qos: .userInitiated)
  }

  // MARK: - React Native Method Exports
  
  // Ensure all methods are properly exported to the bridge
  @objc override func constantsToExport() -> [AnyHashable : Any]! {
    return [
      "moduleName": "RealtimeAudioAnalyzer",
      "supportedMethods": [
        "startAnalysis", "stopAnalysis", "isAnalyzing",
        "start", "stop", "isRunning", 
        "getAnalysisConfig", "setSmoothing", "setFftConfig",
        "enableDebugLogging", "disableDebugLogging"
      ]
    ]
  }
  
  // MARK: - Debug Logging Control
  
  @objc(enableDebugLogging:withRejecter:)
  func enableDebugLogging(resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    debugLoggingEnabled = true
    logMethodCall("enableDebugLogging")
    logMethodResult("enableDebugLogging", success: true)
    resolve(nil)
  }
  
  @objc(disableDebugLogging:withRejecter:)
  func disableDebugLogging(resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("disableDebugLogging")
    debugLoggingEnabled = false
    resolve(nil)
  }

  // MARK: - Cleanup

  private func cleanupFft() {
    if let setup = fftSetup {
      vDSP_DFT_DestroySetup(setup)
      fftSetup = nil
    }
  }

  deinit {
    cleanupFft()
  }

  // MARK: - Public API (Primary Methods)

  @objc(startAnalysis:withResolver:withRejecter:)
  func startAnalysis(config: NSDictionary,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {

    logMethodCall("startAnalysis", parameters: config as? [String: Any])

    if running { 
      logMethodResult("startAnalysis", success: true, error: "Already running")
      resolve(nil)
      return 
    }
    
    // Validate configuration parameters
    let validation = validateConfigParameter(config)
    if !validation.isValid {
      let errorMsg = validation.error ?? "Invalid configuration"
      logMethodResult("startAnalysis", success: false, error: errorMsg)
      reject("E_INVALID_CONFIG", errorMsg, nil)
      return
    }

    // Options parsing with validation - match TypeScript AnalysisConfig interface
    if let fftSizeValue = config["fftSize"] as? NSNumber {
      let newFftSize = max(64, min(16384, fftSizeValue.intValue)) // Validate range
      fftSize = newFftSize
    }
    if let sRate = config["sampleRate"] as? NSNumber { 
      targetSampleRate = max(8000, min(96000, sRate.doubleValue)) // Validate range
    }
    if let smoothingValue = config["smoothing"] as? NSNumber {
      let smoothingDouble = smoothingValue.doubleValue
      smoothingFactor = Float(max(0, min(1, smoothingDouble))) // Validate range
      smoothingEnabled = smoothingDouble > 0
    }
    if let windowFunc = config["windowFunction"] as? String {
      // Store window function preference (currently only hanning is implemented)
      // Future enhancement: support different window functions
      if windowFunc != "hanning" {
        os_log("Warning: Only 'hanning' window function is currently supported, got: %{public}@", log: Self.logger, type: .default, windowFunc)
      }
    }
    
    // Legacy support for additional config options
    if let bufSize = config["bufferSize"] as? NSNumber { 
      bufferSize = UInt32(max(256, min(8192, bufSize.intValue))) // Validate range
    }
    if let cbRate = config["callbackRateHz"] as? NSNumber { 
      callbackRateHz = max(1, min(120, cbRate.doubleValue)) // Validate range
    }
    if let emit = config["emitFft"] as? Bool { emitFft = emit }
    if let se = config["smoothingEnabled"] as? Bool { 
      smoothingEnabled = se 
      // If smoothingEnabled is explicitly set to false, ensure smoothing is 0
      if !se {
        smoothingFactor = 0.0
      }
    }
    if let sf = config["smoothingFactor"] as? NSNumber { 
      let newFactor = Float(max(0, min(1, sf.doubleValue))) // Validate range
      smoothingFactor = newFactor
      // If smoothingFactor is set to 0, disable smoothing
      if newFactor == 0.0 {
        smoothingEnabled = false
      }
    }
    if let ds = config["downsampleBins"] as? NSNumber { downsampleBins = ds.intValue }

    // Permissions
    let session = AVAudioSession.sharedInstance()
    switch session.recordPermission {
    case .granted:
      startEngine(resolve: resolve, reject: reject)
    case .denied:
      let errorMsg = "Microphone permission denied"
      logMethodResult("startAnalysis", success: false, error: errorMsg)
      reject("E_PERMISSION_DENIED", errorMsg, nil)
    case .undetermined:
      session.requestRecordPermission { granted in
        DispatchQueue.main.async {
          if granted {
            self.startEngine(resolve: resolve, reject: reject)
          } else {
            let errorMsg = "Microphone permission denied by user"
            self.logMethodResult("startAnalysis", success: false, error: errorMsg)
            reject("E_PERMISSION_DENIED", errorMsg, nil)
          }
        }
      }
    @unknown default:
      let errorMsg = "Unknown permission state"
      logMethodResult("startAnalysis", success: false, error: errorMsg)
      reject("E_UNKNOWN_PERMISSION", errorMsg, nil)
    }
  }

  @objc(stopAnalysis:withRejecter:)
  func stopAnalysis(resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {

    logMethodCall("stopAnalysis")

    guard running else { 
      logMethodResult("stopAnalysis", success: true, error: "Already stopped")
      resolve(nil)
      return 
    }

    do {
      // Clean up audio engine
      audioEngine?.inputNode.removeTap(onBus: bus)
      audioEngine?.stop()
      audioEngine = nil

      // Deactivate audio session
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      
      // Clean up FFT resources
      cleanupFft()
      running = false
      
      logMethodResult("stopAnalysis", success: true)
      resolve(nil)
    } catch {
      // Even if session deactivation fails, we should still clean up and mark as stopped
      cleanupFft()
      running = false
      
      let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "stop analysis")
      logMethodResult("stopAnalysis", success: false, error: errorMessage)
      reject(errorCode, errorMessage, error)
    }
  }

  @objc(isAnalyzing:withRejecter:)
  func isAnalyzing(resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("isAnalyzing")
    logMethodResult("isAnalyzing", success: true)
    resolve(running)
  }

  @objc(setSmoothing:factor:withResolver:withRejecter:)
  func setSmoothing(enabled: Bool,
                    factor: NSNumber,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    
    logMethodCall("setSmoothing", parameters: ["enabled": enabled, "factor": factor])
    
    // Validate parameters
    let validation = validateSmoothingParameters(enabled: enabled, factor: factor)
    if !validation.isValid {
      let errorMsg = validation.error ?? "Invalid smoothing parameters"
      logMethodResult("setSmoothing", success: false, error: errorMsg)
      reject("E_INVALID_PARAMETER", errorMsg, nil)
      return
    }
    
    let factorFloat = factor.floatValue
    smoothingEnabled = enabled
    smoothingFactor = factorFloat
    
    logMethodResult("setSmoothing", success: true)
    resolve(nil)
  }

  @objc(setFftConfig:downsampleBins:withResolver:withRejecter:)
  func setFftConfig(fftSize: NSNumber,
                    downsampleBins: NSNumber,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    
    logMethodCall("setFftConfig", parameters: ["fftSize": fftSize, "downsampleBins": downsampleBins])
    
    // Validate parameters
    let validation = validateFftConfigParameters(fftSize: fftSize, downsampleBins: downsampleBins)
    if !validation.isValid {
      let errorMsg = validation.error ?? "Invalid FFT configuration parameters"
      logMethodResult("setFftConfig", success: false, error: errorMsg)
      reject("E_INVALID_PARAMETER", errorMsg, nil)
      return
    }
    
    let fftSizeInt = fftSize.intValue
    let downsampleBinsInt = downsampleBins.intValue
    
    // Store only (dynamic resize in-flight is risky). Recommend restart to apply.
    self.fftSize = fftSizeInt
    self.downsampleBins = downsampleBinsInt
    
    logMethodResult("setFftConfig", success: true)
    resolve(nil)
  }

  // MARK: - Legacy Method Aliases (for backward compatibility)

  @objc(start:withResolver:withRejecter:)
  func start(options: NSDictionary,
             resolve: @escaping RCTPromiseResolveBlock,
             reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("start (legacy alias)", parameters: options as? [String: Any])
    startAnalysis(config: options, resolve: resolve, reject: reject)
  }

  @objc(stop:withRejecter:)
  func stop(resolve: @escaping RCTPromiseResolveBlock,
            reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("stop (legacy alias)")
    stopAnalysis(resolve: resolve, reject: reject)
  }

  @objc(isRunning:withRejecter:)
  func isRunning(resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("isRunning (legacy alias)")
    isAnalyzing(resolve: resolve, reject: reject)
  }

  @objc(getAnalysisConfig:withRejecter:)
  func getAnalysisConfig(resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    logMethodCall("getAnalysisConfig")
    
    let config: [String: Any] = [
      "fftSize": fftSize,
      "sampleRate": targetSampleRate,
      "smoothing": smoothingEnabled ? Double(smoothingFactor) : 0.0,
      "windowFunction": "hanning", // Default window function
      // Additional configuration state for completeness
      "bufferSize": Int(bufferSize),
      "callbackRateHz": callbackRateHz,
      "emitFft": emitFft,
      "smoothingEnabled": smoothingEnabled,
      "smoothingFactor": Double(smoothingFactor),
      "downsampleBins": downsampleBins
    ]
    
    logMethodResult("getAnalysisConfig", success: true)
    resolve(config)
  }

  // MARK: - Engine

  private func startEngine(resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    do {
      let session = AVAudioSession.sharedInstance()
      
      // Configure audio session with detailed error handling
      do {
        try session.setCategory(.playAndRecord,
                                mode: .voiceChat,
                                options: [.defaultToSpeaker, .allowBluetoothHFP])
      } catch {
        let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "set audio session category")
        logMethodResult("startEngine", success: false, error: errorMessage)
        reject(errorCode, errorMessage, error)
        return
      }
      
      do {
        try session.setPreferredSampleRate(targetSampleRate)
      } catch {
        // Log warning but continue - this is not critical
        os_log("Warning: Could not set preferred sample rate to %f: %{public}@", log: Self.logger, type: .default, targetSampleRate, error.localizedDescription)
      }

      let preferredBufferDuration = Double(bufferSize) / targetSampleRate
      do {
        try session.setPreferredIOBufferDuration(preferredBufferDuration)
      } catch {
        // Log warning but continue - this is not critical
        os_log("Warning: Could not set preferred buffer duration to %f: %{public}@", log: Self.logger, type: .default, preferredBufferDuration, error.localizedDescription)
      }
      
      do {
        try session.setActive(true)
      } catch {
        let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "activate audio session")
        logMethodResult("startEngine", success: false, error: errorMessage)
        reject(errorCode, errorMessage, error)
        return
      }

      let engine = AVAudioEngine()
      audioEngine = engine

      let inputNode = engine.inputNode
      let hardwareFormat = inputNode.inputFormat(forBus: bus)
      
      // Validate hardware format
      if hardwareFormat.sampleRate == 0 {
        let errorMsg = "Invalid hardware format: sample rate is 0"
        logMethodResult("startEngine", success: false, error: errorMsg)
        reject("E_INVALID_HARDWARE_FORMAT", errorMsg, nil)
        return
      }
      
      if hardwareFormat.channelCount == 0 {
        let errorMsg = "Invalid hardware format: channel count is 0"
        logMethodResult("startEngine", success: false, error: errorMsg)
        reject("E_INVALID_HARDWARE_FORMAT", errorMsg, nil)
        return
      }

      setupFftIfNeeded()

      do {
        inputNode.installTap(onBus: bus, bufferSize: bufferSize, format: hardwareFormat) { [weak self] buffer, time in
          self?.processAudio(buffer: buffer, time: time)
        }
      } catch {
        let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "install audio tap")
        logMethodResult("startEngine", success: false, error: errorMessage)
        reject(errorCode, errorMessage, error)
        return
      }

      do {
        try engine.start()
      } catch {
        let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "start audio engine")
        logMethodResult("startEngine", success: false, error: errorMessage)
        reject(errorCode, errorMessage, error)
        return
      }
      
      running = true
      logMethodResult("startEngine", success: true)
      resolve(nil)
    } catch {
      let (errorCode, errorMessage) = handleAudioEngineError(error, operation: "start audio engine")
      logMethodResult("startEngine", success: false, error: errorMessage)
      reject(errorCode, errorMessage, error)
    }
  }

  private func setupFftIfNeeded() {
    cleanupFft()

    // Use power-of-2 based on bufferSize or fftSize (prefer fftSize if set)
    let desired = max(256, emitFft ? fftSize : Int(bufferSize))
    let n = nextPowerOfTwo(desired)
    logN = vDSP_Length(round(log2(Double(n))))

    do {
      fftSetup = vDSP_DFT_zop_CreateSetup(nil, vDSP_Length(n), vDSP_DFT_Direction.FORWARD)
      
      if fftSetup == nil {
        os_log("Error: Failed to create FFT setup for size %d", log: Self.logger, type: .error, n)
        return
      }

      window = [Float](repeating: 0, count: n)
      vDSP_hann_window(&window, vDSP_Length(n), Int32(vDSP_HANN_NORM))

      windowedInput = [Float](repeating: 0, count: n)
      fftReal = [Float](repeating: 0, count: n)
      fftImag = [Float](repeating: 0, count: n)
      zerosImag = [Float](repeating: 0, count: n)
      magnitudes = [Float](repeating: 0, count: n / 2)
      
      os_log("FFT setup completed successfully for size %d", log: Self.logger, type: .info, n)
    } catch {
      os_log("Error setting up FFT: %{public}@", log: Self.logger, type: .error, error.localizedDescription)
    }
  }

  private func nextPowerOfTwo(_ x: Int) -> Int {
    var v = 1
    while v < x { v <<= 1 }
    return v
  }

  // MARK: - DSP

  private func processAudio(buffer: AVAudioPCMBuffer, time: AVAudioTime) {
    guard let channelData = buffer.floatChannelData else { 
      os_log("Warning: No channel data available in audio buffer", log: Self.logger, type: .default)
      return 
    }

    let frameCount = Int(buffer.frameLength)
    let channelCount = Int(buffer.format.channelCount)
    
    // Validate buffer data
    if frameCount == 0 {
      os_log("Warning: Audio buffer has zero frames", log: Self.logger, type: .default)
      return
    }
    
    if channelCount == 0 {
      os_log("Warning: Audio buffer has zero channels", log: Self.logger, type: .default)
      return
    }

    // Rate-limit callback emissions
    let now = Date().timeIntervalSince1970
    if callbackRateHz > 0, now - lastCallbackTime < (1.0 / callbackRateHz) {
      return
    }
    lastCallbackTime = now

    // Downmix to mono without allocating big arrays
    // (We will reuse windowedInput as our mono scratch buffer for first `frameCount` samples)
    let monoCount = min(frameCount, windowedInput.count)
    if channelCount == 1 {
      // copy
      let src = channelData[0]
      for i in 0..<monoCount { windowedInput[i] = src[i] }
    } else {
      let l = channelData[0]
      let r = channelData[1]
      for i in 0..<monoCount { windowedInput[i] = (l[i] + r[i]) * 0.5 }
    }

    // RMS + Peak
    var rms: Float = 0
    var peak: Float = 0
    windowedInput.withUnsafeBufferPointer { ptr in
      vDSP_rmsqv(ptr.baseAddress!, 1, &rms, vDSP_Length(monoCount))
      vDSP_maxmgv(ptr.baseAddress!, 1, &peak, vDSP_Length(monoCount))
    }

    // Smoothing
    if smoothingEnabled {
      smoothRms = smoothRms + (rms - smoothRms) * smoothingFactor
      smoothPeak = smoothPeak + (peak - smoothPeak) * smoothingFactor
      rms = smoothRms
      peak = smoothPeak
    } else {
      smoothRms = rms
      smoothPeak = peak
    }

    // FFT
    var fftData: [Float] = []
    if emitFft, let setup = fftSetup {
      let n = window.count
      let count = min(monoCount, n)

      // Apply window + zero pad (reusing windowedInput)
      for i in 0..<count {
        windowedInput[i] = windowedInput[i] * window[i]
      }
      if count < n {
        for i in count..<n { windowedInput[i] = 0 }
      }

      // Execute FFT (real input + zero imag)
      vDSP_DFT_Execute(setup, windowedInput, zerosImag, &fftReal, &fftImag)

      // Magnitudes (n/2)
      magnitudes.withUnsafeMutableBufferPointer { magPtr in
        fftReal.withUnsafeMutableBufferPointer { realPtr in
          fftImag.withUnsafeMutableBufferPointer { imagPtr in
            var split = DSPSplitComplex(realp: realPtr.baseAddress!, imagp: imagPtr.baseAddress!)
            vDSP_zvabs(&split, 1, magPtr.baseAddress!, 1, vDSP_Length(n / 2))
          }
        }
      }

      // Normalize
      var scale = (2.0 / Float(n))
      vDSP_vsmul(magnitudes, 1, &scale, &magnitudes, 1, vDSP_Length(n / 2))

      // Downsample
      if downsampleBins > 0, downsampleBins < (n / 2) {
        fftData = resample(magnitudes, targetCount: downsampleBins)
      } else {
        fftData = magnitudes
      }
    }

    // Emit
    let payload: [String: Any] = [
      "timestamp": now * 1000,
      "rms": rms,
      "peak": peak,
      "volume": rms,
      "fft": fftData,
      "frequencyData": fftData,
      "timeData": [],
      "sampleRate": buffer.format.sampleRate,
      "bufferSize": frameCount,
      "channelCount": channelCount
    ]
    
    // Send React Native events if bridge is available
    if bridge != nil {
      sendEvent(withName: "RealtimeAudioAnalyzer:onData", body: payload)
      sendEvent(withName: "AudioAnalysisData", body: payload)
    } else {
      os_log("Warning: Bridge not available, cannot send events to JavaScript", log: Self.logger, type: .default)
    }
    
    // Also post to NotificationCenter for native iOS usage
    NotificationCenter.default.post(
      name: NSNotification.Name("RealtimeAudioAnalyzer:onData"),
      object: self,
      userInfo: payload
    )
  }

  private func resample(_ input: [Float], targetCount: Int) -> [Float] {
    let sourceCount = input.count
    if targetCount <= 0 || sourceCount == 0 { return [] }
    if targetCount >= sourceCount { return input }

    var result = [Float](repeating: 0, count: targetCount)
    let ratio = Float(sourceCount) / Float(targetCount)

    for i in 0..<targetCount {
      let start = Int(Float(i) * ratio)
      let end = min(Int(Float(i + 1) * ratio), sourceCount)
      if start >= end {
        result[i] = input[min(start, sourceCount - 1)]
        continue
      }
      var sum: Float = 0
      for j in start..<end { sum += input[j] }
      result[i] = sum / Float(end - start)
    }
    return result
  }
}

// MARK: - React Native Module Registration
// This ensures the module is properly registered with React Native's bridge
// Both for legacy and TurboModule architectures
// Note: RCT_EXTERN_METHOD declarations are in RealtimeAudioAnalyzer.m
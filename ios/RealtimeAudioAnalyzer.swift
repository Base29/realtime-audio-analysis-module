import Foundation
import AVFoundation
import Accelerate
import React

@objc(RealtimeAudioAnalyzer)
class RealtimeAudioAnalyzer: RCTEventEmitter {

  private var audioEngine: AVAudioEngine?
  private var bus = 0
  private var running = false

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

  // MARK: - Public API

  @objc(start:withResolver:withRejecter:)
  func start(options: NSDictionary,
             resolve: @escaping RCTPromiseResolveBlock,
             reject: @escaping RCTPromiseRejectBlock) {

    if running { return resolve(nil) }

    // Options
    if let bufSize = options["bufferSize"] as? Int { bufferSize = UInt32(bufSize) }
    if let sRate = options["sampleRate"] as? Double { targetSampleRate = sRate }
    if let cbRate = options["callbackRateHz"] as? Double { callbackRateHz = cbRate }
    if let emit = options["emitFft"] as? Bool { emitFft = emit }
    if let se = options["smoothingEnabled"] as? Bool { smoothingEnabled = se }
    if let sf = options["smoothingFactor"] as? Double { smoothingFactor = Float(sf) }
    if let ds = options["downsampleBins"] as? Int { downsampleBins = ds }
    if let fs = options["fftSize"] as? Int { fftSize = fs }

    // Permissions
    let session = AVAudioSession.sharedInstance()
    switch session.recordPermission {
    case .granted:
      startEngine(resolve: resolve, reject: reject)
    case .denied:
      reject("E_PERMISSION_DENIED", "Microphone permission denied", nil)
    case .undetermined:
      session.requestRecordPermission { granted in
        if granted {
          self.startEngine(resolve: resolve, reject: reject)
        } else {
          reject("E_PERMISSION_DENIED", "Microphone permission denied", nil)
        }
      }
    @unknown default:
      reject("E_UNKNOWN", "Unknown permission state", nil)
    }
  }

  @objc(stop:withRejecter:)
  func stop(resolve: @escaping RCTPromiseResolveBlock,
            reject: @escaping RCTPromiseRejectBlock) {

    guard running else { resolve(nil); return }

    audioEngine?.inputNode.removeTap(onBus: bus)
    audioEngine?.stop()
    audioEngine = nil

    do {
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      // non-fatal
    }

    cleanupFft()
    running = false
    resolve(nil)
  }

  @objc(isRunning:withRejecter:)
  func isRunning(resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    resolve(running)
  }

  @objc(setSmoothing:factor:withResolver:withRejecter:)
  func setSmoothing(enabled: Bool,
                    factor: Float,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    smoothingEnabled = enabled
    smoothingFactor = max(0, min(1, factor))
    resolve(nil)
  }

  @objc(setFftConfig:downsampleBins:withResolver:withRejecter:)
  func setFftConfig(fftSize: Int,
                    downsampleBins: Int,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    // Store only (dynamic resize in-flight is risky). Recommend restart to apply.
    self.fftSize = fftSize
    self.downsampleBins = downsampleBins
    resolve(nil)
  }

  // Compatibility aliases
  @objc(startAnalysis:withResolver:withRejecter:)
  func startAnalysis(config: NSDictionary,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    start(options: config, resolve: resolve, reject: reject)
  }

  @objc(stopAnalysis:withRejecter:)
  func stopAnalysis(resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    stop(resolve: resolve, reject: reject)
  }

  @objc(isAnalyzing:withRejecter:)
  func isAnalyzing(resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    resolve(running)
  }

  @objc(getAnalysisConfig:withRejecter:)
  func getAnalysisConfig(resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    resolve([
      "fftSize": fftSize,
      "sampleRate": targetSampleRate,
      "bufferSize": bufferSize,
      "smoothingEnabled": smoothingEnabled,
      "smoothingFactor": smoothingFactor,
      "downsampleBins": downsampleBins
    ])
  }

  // MARK: - Engine

  private func startEngine(resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord,
                              mode: .voiceChat,
                              options: [.defaultToSpeaker, .allowBluetooth])
      try session.setPreferredSampleRate(targetSampleRate)

      let preferredBufferDuration = Double(bufferSize) / targetSampleRate
      try session.setPreferredIOBufferDuration(preferredBufferDuration)
      try session.setActive(true)

      let engine = AVAudioEngine()
      audioEngine = engine

      let inputNode = engine.inputNode
      let hardwareFormat = inputNode.inputFormat(forBus: bus)

      setupFftIfNeeded()

      inputNode.installTap(onBus: bus, bufferSize: bufferSize, format: hardwareFormat) { [weak self] buffer, time in
        self?.processAudio(buffer: buffer, time: time)
      }

      try engine.start()
      running = true
      resolve(nil)
    } catch {
      reject("E_START_FAILED", "Failed to start audio engine", error)
    }
  }

  private func setupFftIfNeeded() {
    cleanupFft()

    // Use power-of-2 based on bufferSize or fftSize (prefer fftSize if set)
    let desired = max(256, emitFft ? fftSize : Int(bufferSize))
    let n = nextPowerOfTwo(desired)
    logN = vDSP_Length(round(log2(Double(n))))

    fftSetup = vDSP_DFT_zop_CreateSetup(nil, vDSP_Length(n), vDSP_DFT_Direction.FORWARD)

    window = [Float](repeating: 0, count: n)
    vDSP_hann_window(&window, vDSP_Length(n), Int32(vDSP_HANN_NORM))

    windowedInput = [Float](repeating: 0, count: n)
    fftReal = [Float](repeating: 0, count: n)
    fftImag = [Float](repeating: 0, count: n)
    zerosImag = [Float](repeating: 0, count: n)
    magnitudes = [Float](repeating: 0, count: n / 2)
  }

  private func nextPowerOfTwo(_ x: Int) -> Int {
    var v = 1
    while v < x { v <<= 1 }
    return v
  }

  // MARK: - DSP

  private func processAudio(buffer: AVAudioPCMBuffer, time: AVAudioTime) {
    guard let channelData = buffer.floatChannelData else { return }

    let frameCount = Int(buffer.frameLength)
    let channelCount = Int(buffer.format.channelCount)

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
    if bridge != nil {
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

      sendEvent(withName: "RealtimeAudioAnalyzer:onData", body: payload)
      sendEvent(withName: "AudioAnalysisData", body: payload)
    }
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
# Testing Guide for Realtime Audio Analysis Module

This guide covers how to test all the production-safe improvements made to the realtime audio analysis module.

## Prerequisites

- React Native 0.83.1+
- iOS 12.0+ / Android API 21+
- Physical device with microphone (simulators have limited audio support)
- Microphone permissions granted

## 1. iOS Native Demo Testing

### Setup
1. Open the iOS project in Xcode
2. Add `AudioAnalyzerDemoView.swift` to your project
3. Create a simple view controller to host the SwiftUI view:

```swift
import UIKit
import SwiftUI

@available(iOS 13.0, *)
class AudioDemoViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let hostingController = UIHostingController(rootView: AudioAnalyzerDemoView())
        addChild(hostingController)
        view.addSubview(hostingController.view)
        
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        hostingController.didMove(toParent: self)
    }
}
```

### Test Cases
1. **Basic Functionality**
   - Tap "Start" - should show "🎤 Recording" status
   - Speak into microphone - RMS and Peak values should update
   - Visual level bar should respond to audio input
   - Tap "Stop" - should return to "⏹ Stopped" status

2. **Sample Rate Verification**
   - Check that sample rate shows 48000 Hz (or fallback rate)
   - Verify in console logs: "AVAudioSession configured - Sample Rate: XXXXHz"

3. **Low Latency Performance**
   - Audio levels should respond immediately to sound (< 50ms latency)
   - No audio dropouts or glitches during recording

4. **Resource Cleanup**
   - Start/stop multiple times - should work consistently
   - Check memory usage doesn't increase after stop
   - Background/foreground app - should handle gracefully

## 2. Android Native Demo Testing

### Setup
1. Add `AudioAnalyzerDemoActivity.kt` to your Android project
2. Add activity to `AndroidManifest.xml`:

```xml
<activity
    android:name="com.realtimeaudio.AudioAnalyzerDemoActivity"
    android:label="Audio Demo"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

### Test Cases
1. **Permission Handling**
   - First launch should request microphone permission
   - Denying permission should show appropriate message
   - Granting permission should enable recording

2. **Audio Processing**
   - Tap "Start" - status should change to "🎤 Recording"
   - RMS/Peak values should update in real-time
   - Progress bar should reflect audio levels
   - Sample rate should show 48000 Hz (or fallback)

3. **Threading Stability**
   - Start/stop rapidly - should not crash
   - Rotate device during recording - should continue working
   - Background app during recording - should handle gracefully

## 3. React Native Example Testing (AudioVisualizer)

### Setup
```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

### Test Cases
1. **Module Linking Verification**
   - Check console for "✅ Module imported successfully"
   - Module Status should show "✅ Available"

2. **Visual Feedback**
   - Frequency bars should animate with audio input
   - RMS circle should pulse with volume
   - Colors should change based on frequency content

3. **Error Handling**
   - Deny microphone permission - should show error message
   - Start without permission - should request and handle gracefully
   - Multiple start/stop cycles - should work consistently

## 4. Stress Testing

### Start/Stop Cycle Test
```javascript
// Add this to your test component
const stressTest = async () => {
  for (let i = 0; i < 50; i++) {
    console.log(`Cycle ${i + 1}/50`);
    await RealtimeAudioAnalyzer.startAnalysis({ fftSize: 1024, sampleRate: 48000 });
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms recording
    await RealtimeAudioAnalyzer.stopAnalysis();
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms pause
  }
  console.log('Stress test completed');
};
```

### Memory Leak Detection
1. **iOS**: Use Xcode Instruments (Leaks tool)
   - Run stress test while monitoring
   - Check for memory leaks in audio processing
   - Verify AVAudioEngine resources are released

2. **Android**: Use Android Studio Profiler
   - Monitor memory usage during stress test
   - Check for AudioRecord leaks
   - Verify native library cleanup

### Background/Foreground Testing
1. Start audio recording
2. Background the app (home button)
3. Foreground the app
4. Verify recording continues or handles state properly
5. Test with phone calls, other audio apps

## 5. Performance Verification

### Latency Testing
- Use oscilloscope or audio analysis app
- Generate test tone, measure input-to-callback latency
- Should be < 50ms on modern devices

### CPU Usage
- Monitor CPU usage during recording
- Should be < 5% on modern devices
- No audio thread priority inversions

### Memory Allocations
- **iOS**: No allocations in `processAudio` callback
- **Android**: No allocations in audio processing loop
- Use profiling tools to verify

## 6. Quality Gates Checklist

### ✅ No Memory Leaks
- [ ] iOS: AVAudioEngine properly stopped and deallocated
- [ ] iOS: Audio taps removed on stop
- [ ] iOS: AVAudioSession deactivated
- [ ] Android: AudioRecord stopped and released
- [ ] Android: Processing thread properly joined
- [ ] Native FFT resources cleaned up

### ✅ No Allocations in Audio Callback
- [ ] iOS: No array creation in `processAudio`
- [ ] iOS: Reuse pre-allocated buffers
- [ ] Android: No allocations in processing loop
- [ ] Android: Reuse read buffers

### ✅ Stable Start/Stop Cycles
- [ ] 50+ start/stop cycles without crash
- [ ] Idempotent start (calling twice doesn't crash)
- [ ] Clean stop (all resources released)
- [ ] Consistent behavior across cycles

### ✅ Sample Rate and Mono Behavior
- [ ] 48kHz preferred, fallback logged
- [ ] Mono input configured correctly
- [ ] Stereo downmix working if needed
- [ ] Actual sample rate reported in events

### ✅ Low Latency Configuration
- [ ] iOS: AVAudioSession configured for low latency
- [ ] iOS: Preferred buffer duration set
- [ ] Android: VOICE_RECOGNITION audio source
- [ ] Android: Minimum buffer size used

## 7. Troubleshooting

### Common Issues
1. **"Module not found"**: Check linking configuration
2. **Permission denied**: Ensure microphone permissions
3. **High latency**: Check buffer sizes and audio session config
4. **Memory leaks**: Verify cleanup in stop methods
5. **Crashes on start/stop**: Check thread safety and resource management

### Debug Logging
Enable verbose logging to diagnose issues:

**iOS**: Add to `startEngine`:
```swift
print("🎵 Buffer size: \(bufferSize), Sample rate: \(actualSampleRate)")
```

**Android**: Add to `start`:
```kotlin
Log.d(TAG, "Buffer size: $bufferSize, Sample rate: $actualSampleRate")
```

### Performance Profiling
- **iOS**: Xcode Instruments (Time Profiler, Leaks)
- **Android**: Android Studio Profiler (CPU, Memory)
- **React Native**: Flipper performance monitoring

This comprehensive testing approach ensures the audio analysis module meets production quality standards with low latency, stable operation, and proper resource management.
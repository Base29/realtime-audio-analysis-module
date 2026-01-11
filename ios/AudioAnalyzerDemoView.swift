//
//  AudioAnalyzerDemoView.swift
//  RealtimeAudioAnalyzer
//
//  Native iOS demo for audio analysis
//

import SwiftUI
import AVFoundation

@available(iOS 13.0, *)
struct AudioAnalyzerDemoView: View {
    @StateObject private var audioManager = AudioDemoManager()
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Audio Analyzer Demo")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            // Status indicators
            VStack(spacing: 15) {
                HStack {
                    Text("Status:")
                    Spacer()
                    Text(audioManager.isRecording ? "🎤 Recording" : "⏹ Stopped")
                        .foregroundColor(audioManager.isRecording ? .green : .red)
                }
                
                HStack {
                    Text("Sample Rate:")
                    Spacer()
                    Text("\(Int(audioManager.sampleRate)) Hz")
                }
                
                HStack {
                    Text("RMS Level:")
                    Spacer()
                    Text(String(format: "%.3f", audioManager.rmsLevel))
                }
                
                HStack {
                    Text("Peak Level:")
                    Spacer()
                    Text(String(format: "%.3f", audioManager.peakLevel))
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            // Visual level indicator
            VStack {
                Text("Audio Level")
                    .font(.headline)
                
                ZStack {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 20)
                        .cornerRadius(10)
                    
                    HStack {
                        Rectangle()
                            .fill(LinearGradient(
                                gradient: Gradient(colors: [.green, .yellow, .red]),
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            .frame(width: CGFloat(audioManager.rmsLevel * 300), height: 20)
                            .cornerRadius(10)
                        
                        Spacer()
                    }
                }
                .frame(width: 300)
            }
            
            // Control buttons
            HStack(spacing: 20) {
                Button(action: {
                    if audioManager.isRecording {
                        audioManager.stopRecording()
                    } else {
                        audioManager.startRecording()
                    }
                }) {
                    Text(audioManager.isRecording ? "Stop" : "Start")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(width: 100, height: 50)
                        .background(audioManager.isRecording ? Color.red : Color.green)
                        .cornerRadius(25)
                }
                
                Button("Reset") {
                    audioManager.reset()
                }
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(width: 100, height: 50)
                .background(Color.blue)
                .cornerRadius(25)
            }
            
            if let error = audioManager.errorMessage {
                Text("Error: \(error)")
                    .foregroundColor(.red)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
            }
            
            Spacer()
        }
        .padding()
    }
}

@available(iOS 13.0, *)
class AudioDemoManager: ObservableObject {
    @Published var isRecording = false
    @Published var rmsLevel: Float = 0.0
    @Published var peakLevel: Float = 0.0
    @Published var sampleRate: Double = 48000.0
    @Published var errorMessage: String?
    
    private var audioAnalyzer: RealtimeAudioAnalyzer?
    
    init() {
        audioAnalyzer = RealtimeAudioAnalyzer()
        setupNotifications()
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("RealtimeAudioAnalyzer:onData"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let data = notification.userInfo {
                self?.updateAudioData(data)
            }
        }
    }
    
    private func updateAudioData(_ data: [AnyHashable: Any]) {
        if let rms = data["rms"] as? Float {
            self.rmsLevel = rms
        }
        if let peak = data["peak"] as? Float {
            self.peakLevel = peak
        }
        if let sampleRate = data["sampleRate"] as? Double {
            self.sampleRate = sampleRate
        }
    }
    
    func startRecording() {
        errorMessage = nil
        
        audioAnalyzer?.start([
            "bufferSize": 1024,
            "sampleRate": 48000,
            "callbackRateHz": 30,
            "emitFft": false
        ], withResolver: { [weak self] _ in
            DispatchQueue.main.async {
                self?.isRecording = true
            }
        }, withRejecter: { [weak self] _, message, _ in
            DispatchQueue.main.async {
                self?.errorMessage = message
                self?.isRecording = false
            }
        })
    }
    
    func stopRecording() {
        audioAnalyzer?.stop({ [weak self] _ in
            DispatchQueue.main.async {
                self?.isRecording = false
            }
        }, withRejecter: { [weak self] _, message, _ in
            DispatchQueue.main.async {
                self?.errorMessage = message
            }
        })
    }
    
    func reset() {
        stopRecording()
        rmsLevel = 0.0
        peakLevel = 0.0
        errorMessage = nil
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// Preview for SwiftUI
@available(iOS 13.0, *)
struct AudioAnalyzerDemoView_Previews: PreviewProvider {
    static var previews: some View {
        AudioAnalyzerDemoView()
    }
}
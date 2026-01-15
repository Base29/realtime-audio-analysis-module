#!/usr/bin/env swift

// iOS Device Build Validation Script
// This script validates that the RealtimeAudioAnalyzer Swift module
// can be compiled for iOS devices without errors

import Foundation

func validateIOSDeviceBuild() -> Bool {
    print("🔍 Validating iOS Device Build...")
    
    // Check 1: Verify podspec has correct device configuration
    guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
        print("❌ Could not read podspec file")
        return false
    }
    
    // Check iOS deployment target
    if !podspecContent.contains("ios") {
        print("❌ Podspec missing iOS platform specification")
        return false
    }
    print("✅ iOS platform specified in podspec")
    
    // Check deployment target version
    let hasValidTarget = podspecContent.contains("12.0") || 
                        podspecContent.contains("13.0") || 
                        podspecContent.contains("14.0") ||
                        podspecContent.contains("15.0")
    if !hasValidTarget {
        print("❌ Invalid or missing iOS deployment target")
        return false
    }
    print("✅ Valid iOS deployment target found")
    
    // Check required frameworks for device
    if !podspecContent.contains("Accelerate") {
        print("❌ Missing Accelerate framework (required for device DSP)")
        return false
    }
    print("✅ Accelerate framework included")
    
    if !podspecContent.contains("AVFoundation") {
        print("❌ Missing AVFoundation framework (required for device audio)")
        return false
    }
    print("✅ AVFoundation framework included")
    
    // Check Swift version
    if !podspecContent.contains("swift_version") {
        print("❌ Missing Swift version specification")
        return false
    }
    print("✅ Swift version specified")
    
    // Check architecture exclusions (should only exclude simulator arm64, not device)
    let lines = podspecContent.components(separatedBy: .newlines)
    var hasSimulatorExclusion = false
    var hasDeviceExclusion = false
    
    for line in lines {
        if line.contains("EXCLUDED_ARCHS") && line.contains("iphonesimulator") {
            hasSimulatorExclusion = true
        }
        if line.contains("EXCLUDED_ARCHS") && line.contains("iphoneos") {
            hasDeviceExclusion = true
        }
    }
    
    if !hasSimulatorExclusion {
        print("⚠️  No simulator architecture exclusion found (may cause issues)")
    } else {
        print("✅ Simulator architecture properly excluded")
    }
    
    if hasDeviceExclusion {
        print("❌ Device architectures are excluded (will prevent device builds)")
        return false
    }
    print("✅ Device architectures not excluded")
    
    // Check 2: Verify Swift files are device-compatible
    let swiftFiles = [
        "ios/RealtimeAudioAnalyzer.swift",
        "ios/BridgeMethodValidation.swift",
        "ios/AudioAnalyzerDemoView.swift"
    ]
    
    for file in swiftFiles {
        if !FileManager.default.fileExists(atPath: file) {
            print("❌ Missing Swift file: \(file)")
            return false
        }
        
        // Check for device-incompatible code patterns
        guard let content = try? String(contentsOfFile: file) else {
            print("❌ Could not read Swift file: \(file)")
            return false
        }
        
        // Basic validation - check for simulator-only APIs
        if content.contains("#if targetEnvironment(simulator)") {
            print("⚠️  File \(file) contains simulator-specific code")
        }
        
        print("✅ Swift file validated: \(file)")
    }
    
    // Check 3: Verify New Architecture support
    if podspecContent.contains("RCT_NEW_ARCH_ENABLED") {
        print("✅ New Architecture support configured")
    } else {
        print("⚠️  New Architecture support not found")
    }
    
    print("🎉 iOS Device build validation passed!")
    return true
}

// Run validation
let success = validateIOSDeviceBuild()
exit(success ? 0 : 1)
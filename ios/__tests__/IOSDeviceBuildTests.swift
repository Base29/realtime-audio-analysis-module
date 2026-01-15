import XCTest
import Foundation

// iOS Device Build Validation Tests
// These tests validate that the module can be built for iOS devices

class IOSDeviceBuildTests: XCTestCase {
    
    func testDeviceArchitectureSupport() {
        // Verify podspec supports device architectures
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check that device architectures are not excluded
        // The podspec should only exclude simulator arm64, not device architectures
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
        
        XCTAssertTrue(hasSimulatorExclusion, "Should exclude arm64 for simulator")
        XCTAssertFalse(hasDeviceExclusion, "Should NOT exclude architectures for device")
    }
    
    func testIOSDeploymentTarget() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check iOS deployment target is appropriate for devices
        XCTAssertTrue(podspecContent.contains("ios"), "Should specify iOS platform")
        
        // iOS 12.0+ is a good minimum for device compatibility
        let hasValidDeploymentTarget = podspecContent.contains("12.0") || 
                                     podspecContent.contains("13.0") || 
                                     podspecContent.contains("14.0") ||
                                     podspecContent.contains("15.0")
        XCTAssertTrue(hasValidDeploymentTarget, "Should have valid iOS deployment target")
    }
    
    func testRequiredFrameworksForDevice() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for frameworks required on device
        XCTAssertTrue(podspecContent.contains("Accelerate"), "Should include Accelerate framework for device DSP")
        XCTAssertTrue(podspecContent.contains("AVFoundation"), "Should include AVFoundation for device audio")
    }
    
    func testSwiftVersionCompatibility() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check Swift version is specified for device compatibility
        XCTAssertTrue(podspecContent.contains("swift_version"), "Should specify Swift version")
        XCTAssertTrue(podspecContent.contains("5.0"), "Should use Swift 5.0+ for device compatibility")
    }
    
    func testDeviceSpecificConfigurations() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for device-specific compiler flags
        XCTAssertTrue(podspecContent.contains("OTHER_CPLUSPLUSFLAGS"), "Should have C++ flags for device builds")
        XCTAssertTrue(podspecContent.contains("CLANG_CXX_LANGUAGE_STANDARD"), "Should specify C++ standard for device")
    }
    
    func testNewArchitectureSupport() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for New Architecture (Fabric/TurboModules) support on device
        XCTAssertTrue(podspecContent.contains("RCT_NEW_ARCH_ENABLED"), "Should support New Architecture on device")
        XCTAssertTrue(podspecContent.contains("React-Codegen"), "Should include Codegen for New Architecture")
    }
}
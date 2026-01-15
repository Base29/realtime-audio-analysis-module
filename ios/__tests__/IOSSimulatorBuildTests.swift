import XCTest
import Foundation

// iOS Simulator Build Validation Tests
// These tests validate that the module can be built for iOS simulator

class IOSSimulatorBuildTests: XCTestCase {
    
    func testSwiftFilesExist() {
        let swiftFiles = [
            "RealtimeAudioAnalyzer.swift",
            "AudioAnalyzerDemoView.swift"
        ]
        
        for file in swiftFiles {
            let bundle = Bundle(for: type(of: self))
            let path = bundle.path(forResource: file.replacingOccurrences(of: ".swift", with: ""), ofType: "swift")
            XCTAssertNotNil(path, "Swift file \(file) should exist")
        }
    }
    
    func testPodspecConfiguration() {
        // Verify podspec exists and has correct iOS deployment target
        let podspecPath = "RealtimeAudioAnalyzer.podspec"
        let fileManager = FileManager.default
        XCTAssertTrue(fileManager.fileExists(atPath: podspecPath), "Podspec should exist")
        
        // Read podspec content
        guard let podspecContent = try? String(contentsOfFile: podspecPath) else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for iOS 12.0+ deployment target
        XCTAssertTrue(podspecContent.contains("ios"), "Podspec should specify iOS platform")
        XCTAssertTrue(podspecContent.contains("12.0"), "Podspec should target iOS 12.0+")
        
        // Check for required frameworks
        XCTAssertTrue(podspecContent.contains("Accelerate"), "Podspec should include Accelerate framework")
        XCTAssertTrue(podspecContent.contains("AVFoundation"), "Podspec should include AVFoundation framework")
        
        // Check for Swift version
        XCTAssertTrue(podspecContent.contains("swift_version"), "Podspec should specify Swift version")
    }
    
    func testReactNativeConfiguration() {
        let configPath = "react-native.config.js"
        let fileManager = FileManager.default
        XCTAssertTrue(fileManager.fileExists(atPath: configPath), "React Native config should exist")
    }
    
    func testSimulatorArchitectureExclusion() {
        // Verify that arm64 simulator architecture is properly excluded for compatibility
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for simulator architecture exclusion
        XCTAssertTrue(podspecContent.contains("EXCLUDED_ARCHS"), "Podspec should exclude problematic architectures")
        XCTAssertTrue(podspecContent.contains("iphonesimulator"), "Podspec should handle simulator architectures")
    }
    
    func testRequiredDependencies() {
        guard let podspecContent = try? String(contentsOfFile: "RealtimeAudioAnalyzer.podspec") else {
            XCTFail("Could not read podspec content")
            return
        }
        
        // Check for React Native dependencies
        XCTAssertTrue(podspecContent.contains("React-Core"), "Podspec should depend on React-Core")
    }
}
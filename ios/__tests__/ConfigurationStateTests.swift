import XCTest
@testable import RealtimeAudioAnalyzer

/**
 * Configuration State Management Tests
 * Tests that configuration state is properly managed and consistent
 * 
 * **Validates: Requirements 1.4, 1.5**
 */
class ConfigurationStateTests: XCTestCase {
    
    var analyzer: RealtimeAudioAnalyzer!
    
    override func setUp() {
        super.setUp()
        analyzer = RealtimeAudioAnalyzer()
    }
    
    override func tearDown() {
        analyzer = nil
        super.tearDown()
    }
    
    func testSetSmoothingUpdatesState() {
        let expectation = XCTestExpectation(description: "setSmoothing should update state")
        
        // Set smoothing configuration
        analyzer.setSmoothing(enabled: true, factor: NSNumber(value: 0.7)) { _ in
            // Get current configuration
            self.analyzer.getAnalysisConfig({ config in
                guard let configDict = config as? [String: Any] else {
                    XCTFail("Config should be a dictionary")
                    return
                }
                
                // Verify smoothing state is updated
                XCTAssertEqual(configDict["smoothingEnabled"] as? Bool, true)
                XCTAssertEqual(configDict["smoothingFactor"] as? Double, 0.7, accuracy: 0.001)
                XCTAssertEqual(configDict["smoothing"] as? Double, 0.7, accuracy: 0.001)
                
                expectation.fulfill()
            }) { error in
                XCTFail("getAnalysisConfig should not fail: \(error?.localizedDescription ?? "unknown error")")
            }
        } reject: { _, message, _ in
            XCTFail("setSmoothing should not fail: \(message ?? "unknown error")")
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSetFftConfigUpdatesState() {
        let expectation = XCTestExpectation(description: "setFftConfig should update state")
        
        // Set FFT configuration
        analyzer.setFftConfig(fftSize: NSNumber(value: 2048), downsampleBins: NSNumber(value: 256)) { _ in
            // Get current configuration
            self.analyzer.getAnalysisConfig({ config in
                guard let configDict = config as? [String: Any] else {
                    XCTFail("Config should be a dictionary")
                    return
                }
                
                // Verify FFT state is updated
                XCTAssertEqual(configDict["fftSize"] as? Int, 2048)
                XCTAssertEqual(configDict["downsampleBins"] as? Int, 256)
                
                expectation.fulfill()
            }) { error in
                XCTFail("getAnalysisConfig should not fail: \(error?.localizedDescription ?? "unknown error")")
            }
        } reject: { _, message, _ in
            XCTFail("setFftConfig should not fail: \(message ?? "unknown error")")
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testConfigurationStateConsistency() {
        let expectation = XCTestExpectation(description: "Configuration state should be consistent")
        
        // Set multiple configuration values
        analyzer.setSmoothing(enabled: false, factor: NSNumber(value: 0.0)) { _ in
            self.analyzer.setFftConfig(fftSize: NSNumber(value: 512), downsampleBins: NSNumber(value: -1)) { _ in
                // Get current configuration
                self.analyzer.getAnalysisConfig({ config in
                    guard let configDict = config as? [String: Any] else {
                        XCTFail("Config should be a dictionary")
                        return
                    }
                    
                    // Verify all state is consistent
                    XCTAssertEqual(configDict["smoothingEnabled"] as? Bool, false)
                    XCTAssertEqual(configDict["smoothingFactor"] as? Double, 0.0, accuracy: 0.001)
                    XCTAssertEqual(configDict["smoothing"] as? Double, 0.0, accuracy: 0.001)
                    XCTAssertEqual(configDict["fftSize"] as? Int, 512)
                    XCTAssertEqual(configDict["downsampleBins"] as? Int, -1)
                    
                    // Verify required fields are present
                    XCTAssertNotNil(configDict["sampleRate"])
                    XCTAssertNotNil(configDict["windowFunction"])
                    XCTAssertNotNil(configDict["bufferSize"])
                    XCTAssertNotNil(configDict["callbackRateHz"])
                    XCTAssertNotNil(configDict["emitFft"])
                    
                    expectation.fulfill()
                }) { error in
                    XCTFail("getAnalysisConfig should not fail: \(error?.localizedDescription ?? "unknown error")")
                }
            } reject: { _, message, _ in
                XCTFail("setFftConfig should not fail: \(message ?? "unknown error")")
            }
        } reject: { _, message, _ in
            XCTFail("setSmoothing should not fail: \(message ?? "unknown error")")
        }
        
        wait(for: [expectation], timeout: 2.0)
    }
}
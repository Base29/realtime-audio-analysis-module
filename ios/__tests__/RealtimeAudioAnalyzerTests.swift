import XCTest
import AVFoundation
@testable import RealtimeAudioAnalyzer

class RealtimeAudioAnalyzerTests: XCTestCase {
    
    var analyzer: RealtimeAudioAnalyzer!
    
    override func setUp() {
        super.setUp()
        analyzer = RealtimeAudioAnalyzer()
    }
    
    override func tearDown() {
        // Clean up any running audio engine
        let expectation = XCTestExpectation(description: "Stop audio engine")
        analyzer.stop(resolve: { _ in
            expectation.fulfill()
        }, reject: { _, _, _ in
            expectation.fulfill()
        })
        wait(for: [expectation], timeout: 5.0)
        
        analyzer = nil
        super.tearDown()
    }
    
    // MARK: - Test audio engine initialization (Task 5.1)
    
    func testAudioEngineInitializationWithDefaultConfig() {
        let expectation = XCTestExpectation(description: "Start audio engine with default config")
        
        let defaultConfig: NSDictionary = [:]
        
        analyzer.start(options: defaultConfig, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Start should not reject with default config. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testAudioEngineInitializationWithCustomBufferSize() {
        let expectation = XCTestExpectation(description: "Start audio engine with custom buffer size")
        
        let config: NSDictionary = [
            "bufferSize": 2048
        ]
        
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Start should not reject with valid buffer size. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testAudioEngineInitializationWithCustomSampleRate() {
        let expectation = XCTestExpectation(description: "Start audio engine with custom sample rate")
        
        let config: NSDictionary = [
            "sampleRate": 44100.0
        ]
        
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Start should not reject with valid sample rate. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testAudioEngineInitializationWithAllOptions() {
        let expectation = XCTestExpectation(description: "Start audio engine with all configuration options")
        
        let config: NSDictionary = [
            "bufferSize": 1024,
            "sampleRate": 48000.0,
            "callbackRateHz": 60.0,
            "emitFft": true
        ]
        
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Start should not reject with valid configuration. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testAudioEngineInitializationWhenAlreadyRunning() {
        let startExpectation = XCTestExpectation(description: "Start audio engine first time")
        let secondStartExpectation = XCTestExpectation(description: "Start audio engine second time")
        
        let config: NSDictionary = [:]
        
        // Start first time
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "First start should resolve with nil on success")
            startExpectation.fulfill()
            
            // Start second time while already running
            self.analyzer.start(options: config, resolve: { result in
                XCTAssertNil(result, "Second start should resolve with nil (no-op)")
                secondStartExpectation.fulfill()
            }, reject: { code, message, error in
                XCTFail("Second start should not reject when already running. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                secondStartExpectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("First start should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            startExpectation.fulfill()
        })
        
        wait(for: [startExpectation, secondStartExpectation], timeout: 10.0)
    }
}
    
    // MARK: - Test event emission functionality (Task 5.2)
    
    func testSupportedEventsContainsBothEventNames() {
        let supportedEvents = analyzer.supportedEvents()
        
        XCTAssertNotNil(supportedEvents, "supportedEvents should not return nil")
        XCTAssertTrue(supportedEvents!.contains("RealtimeAudioAnalyzer:onData"), "Should support legacy event name")
        XCTAssertTrue(supportedEvents!.contains("AudioAnalysisData"), "Should support new event name")
    }
    
    func testEventEmissionStructure() {
        // This test verifies that events are emitted with the correct structure
        // Note: In a real test environment, we would need to mock the bridge to capture events
        // For now, we test that the module can be started and the supported events are correct
        
        let expectation = XCTestExpectation(description: "Start audio engine for event testing")
        
        let config: NSDictionary = [
            "emitFft": true,
            "callbackRateHz": 1.0  // Low rate for testing
        ]
        
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            
            // Verify that the analyzer is running and can emit events
            let isRunningExpectation = XCTestExpectation(description: "Check if analyzer is running")
            
            self.analyzer.isRunning(resolve: { isRunning in
                XCTAssertTrue(isRunning as! Bool, "Analyzer should be running after start")
                isRunningExpectation.fulfill()
            }, reject: { _, _, _ in
                XCTFail("isRunning should not reject")
                isRunningExpectation.fulfill()
            })
            
            self.wait(for: [isRunningExpectation], timeout: 5.0)
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Start should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testEventCompatibilityBetweenEventNames() {
        // Test that both event names are supported for backward compatibility
        let supportedEvents = analyzer.supportedEvents()
        
        XCTAssertNotNil(supportedEvents, "supportedEvents should not return nil")
        
        let legacyEventName = "RealtimeAudioAnalyzer:onData"
        let newEventName = "AudioAnalysisData"
        
        XCTAssertTrue(supportedEvents!.contains(legacyEventName), "Should support legacy event name: \(legacyEventName)")
        XCTAssertTrue(supportedEvents!.contains(newEventName), "Should support new event name: \(newEventName)")
        
        // Verify both events are in the supported list
        XCTAssertEqual(supportedEvents!.count, 2, "Should support exactly 2 event names")
    }
    
    // MARK: - Test JavaScript bridge methods (Task 5.3)
    
    func testStartAnalysisMethod() {
        let expectation = XCTestExpectation(description: "Test startAnalysis method")
        
        let config: NSDictionary = [
            "bufferSize": 1024,
            "sampleRate": 44100.0
        ]
        
        analyzer.startAnalysis(config: config, resolve: { result in
            XCTAssertNil(result, "startAnalysis should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("startAnalysis should not reject with valid config. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testStopAnalysisMethod() {
        let startExpectation = XCTestExpectation(description: "Start analysis first")
        let stopExpectation = XCTestExpectation(description: "Stop analysis")
        
        let config: NSDictionary = [:]
        
        // Start first
        analyzer.startAnalysis(config: config, resolve: { result in
            XCTAssertNil(result, "startAnalysis should resolve with nil on success")
            startExpectation.fulfill()
            
            // Then stop
            self.analyzer.stopAnalysis(resolve: { result in
                XCTAssertNil(result, "stopAnalysis should resolve with nil on success")
                stopExpectation.fulfill()
            }, reject: { code, message, error in
                XCTFail("stopAnalysis should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                stopExpectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("startAnalysis should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            startExpectation.fulfill()
        })
        
        wait(for: [startExpectation, stopExpectation], timeout: 10.0)
    }
    
    func testIsAnalyzingMethod() {
        let expectation = XCTestExpectation(description: "Test isAnalyzing method")
        
        // Test when not running
        analyzer.isAnalyzing(resolve: { isAnalyzing in
            XCTAssertFalse(isAnalyzing as! Bool, "Should not be analyzing initially")
            
            // Start analysis
            let config: NSDictionary = [:]
            self.analyzer.startAnalysis(config: config, resolve: { _ in
                // Test when running
                self.analyzer.isAnalyzing(resolve: { isAnalyzing in
                    XCTAssertTrue(isAnalyzing as! Bool, "Should be analyzing after start")
                    expectation.fulfill()
                }, reject: { code, message, error in
                    XCTFail("isAnalyzing should not reject when running. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                    expectation.fulfill()
                })
            }, reject: { code, message, error in
                XCTFail("startAnalysis should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                expectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("isAnalyzing should not reject when not running. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testGetAnalysisConfigMethod() {
        let expectation = XCTestExpectation(description: "Test getAnalysisConfig method")
        
        analyzer.getAnalysisConfig(resolve: { config in
            XCTAssertNotNil(config, "getAnalysisConfig should return a config object")
            
            if let configDict = config as? [String: Any] {
                XCTAssertNotNil(configDict["fftSize"], "Config should contain fftSize")
                XCTAssertNotNil(configDict["sampleRate"], "Config should contain sampleRate")
                XCTAssertNotNil(configDict["bufferSize"], "Config should contain bufferSize")
                XCTAssertNotNil(configDict["smoothingEnabled"], "Config should contain smoothingEnabled")
                XCTAssertNotNil(configDict["smoothingFactor"], "Config should contain smoothingFactor")
            } else {
                XCTFail("Config should be a dictionary")
            }
            
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("getAnalysisConfig should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testSetSmoothingMethod() {
        let expectation = XCTestExpectation(description: "Test setSmoothing method")
        
        analyzer.setSmoothing(enabled: true, factor: 0.7, resolve: { result in
            XCTAssertNil(result, "setSmoothing should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("setSmoothing should not reject with valid parameters. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testSetFftConfigMethod() {
        let expectation = XCTestExpectation(description: "Test setFftConfig method")
        
        analyzer.setFftConfig(fftSize: 2048, downsampleBins: 64, resolve: { result in
            XCTAssertNil(result, "setFftConfig should resolve with nil on success")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("setFftConfig should not reject with valid parameters. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testLegacyMethodsStillWork() {
        let expectation = XCTestExpectation(description: "Test legacy start/stop methods")
        
        let config: NSDictionary = [:]
        
        // Test legacy start method
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Legacy start should resolve with nil on success")
            
            // Test legacy stop method
            self.analyzer.stop(resolve: { result in
                XCTAssertNil(result, "Legacy stop should resolve with nil on success")
                expectation.fulfill()
            }, reject: { code, message, error in
                XCTFail("Legacy stop should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                expectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("Legacy start should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    // MARK: - Test cleanup functionality (Task 5.4)
    
    func testStopMethodCleansUpResources() {
        let startExpectation = XCTestExpectation(description: "Start audio engine")
        let stopExpectation = XCTestExpectation(description: "Stop and cleanup audio engine")
        
        let config: NSDictionary = [:]
        
        // Start the engine
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            startExpectation.fulfill()
            
            // Verify it's running
            self.analyzer.isRunning(resolve: { isRunning in
                XCTAssertTrue(isRunning as! Bool, "Should be running after start")
                
                // Stop the engine
                self.analyzer.stop(resolve: { result in
                    XCTAssertNil(result, "Stop should resolve with nil on success")
                    
                    // Verify it's no longer running
                    self.analyzer.isRunning(resolve: { isRunning in
                        XCTAssertFalse(isRunning as! Bool, "Should not be running after stop")
                        stopExpectation.fulfill()
                    }, reject: { code, message, error in
                        XCTFail("isRunning should not reject after stop. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                        stopExpectation.fulfill()
                    })
                }, reject: { code, message, error in
                    XCTFail("Stop should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                    stopExpectation.fulfill()
                })
            }, reject: { code, message, error in
                XCTFail("isRunning should not reject when running. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                stopExpectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("Start should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            startExpectation.fulfill()
        })
        
        wait(for: [startExpectation, stopExpectation], timeout: 15.0)
    }
    
    func testStopWhenNotRunning() {
        let expectation = XCTestExpectation(description: "Stop when not running should succeed")
        
        // Try to stop when not running - should succeed gracefully
        analyzer.stop(resolve: { result in
            XCTAssertNil(result, "Stop should resolve with nil even when not running")
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("Stop should not reject when not running. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testAudioSessionDeactivation() {
        let startExpectation = XCTestExpectation(description: "Start audio engine")
        let stopExpectation = XCTestExpectation(description: "Stop and deactivate audio session")
        
        let config: NSDictionary = [:]
        
        // Start the engine (this should activate the audio session)
        analyzer.start(options: config, resolve: { result in
            XCTAssertNil(result, "Start should resolve with nil on success")
            
            // Check that audio session is active
            let session = AVAudioSession.sharedInstance()
            // Note: We can't easily test the exact session state without more complex setup
            // but we can verify the stop method completes successfully
            
            startExpectation.fulfill()
            
            // Stop the engine (this should deactivate the audio session)
            self.analyzer.stop(resolve: { result in
                XCTAssertNil(result, "Stop should resolve with nil on success")
                
                // Verify the analyzer is no longer running
                self.analyzer.isRunning(resolve: { isRunning in
                    XCTAssertFalse(isRunning as! Bool, "Should not be running after stop")
                    stopExpectation.fulfill()
                }, reject: { code, message, error in
                    XCTFail("isRunning should not reject after stop. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                    stopExpectation.fulfill()
                })
            }, reject: { code, message, error in
                XCTFail("Stop should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                stopExpectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("Start should not reject. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            startExpectation.fulfill()
        })
        
        wait(for: [startExpectation, stopExpectation], timeout: 15.0)
    }
    
    func testMultipleStartStopCycles() {
        let expectation = XCTestExpectation(description: "Multiple start/stop cycles")
        
        let config: NSDictionary = [:]
        
        // First cycle
        analyzer.start(options: config, resolve: { _ in
            self.analyzer.stop(resolve: { _ in
                // Second cycle
                self.analyzer.start(options: config, resolve: { _ in
                    self.analyzer.stop(resolve: { _ in
                        // Third cycle
                        self.analyzer.start(options: config, resolve: { _ in
                            self.analyzer.stop(resolve: { _ in
                                expectation.fulfill()
                            }, reject: { code, message, error in
                                XCTFail("Third stop failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                                expectation.fulfill()
                            })
                        }, reject: { code, message, error in
                            XCTFail("Third start failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                            expectation.fulfill()
                        })
                    }, reject: { code, message, error in
                        XCTFail("Second stop failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                        expectation.fulfill()
                    })
                }, reject: { code, message, error in
                    XCTFail("Second start failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                    expectation.fulfill()
                })
            }, reject: { code, message, error in
                XCTFail("First stop failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
                expectation.fulfill()
            })
        }, reject: { code, message, error in
            XCTFail("First start failed. Code: \(code ?? "nil"), Message: \(message ?? "nil")")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 30.0)
    }
}
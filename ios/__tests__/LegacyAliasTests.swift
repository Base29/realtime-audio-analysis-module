import XCTest
@testable import RealtimeAudioAnalyzer

class LegacyAliasTests: XCTestCase {
    
    var analyzer: RealtimeAudioAnalyzer!
    
    override func setUp() {
        super.setUp()
        analyzer = RealtimeAudioAnalyzer()
    }
    
    override func tearDown() {
        analyzer = nil
        super.tearDown()
    }
    
    func testStartAnalysisAliasPointsToStart() {
        // Test that start (legacy) calls startAnalysis (primary)
        let expectation = XCTestExpectation(description: "start method should call startAnalysis")
        
        let config: NSDictionary = ["fftSize": 1024]
        
        analyzer.start(options: config, resolve: { result in
            // If we get here, the method was called successfully
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("start method should not reject: \(message ?? "unknown error")")
        })
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testStopAnalysisAliasPointsToStop() {
        // Test that stop (legacy) calls stopAnalysis (primary)
        let expectation = XCTestExpectation(description: "stop method should call stopAnalysis")
        
        analyzer.stop(resolve: { result in
            // If we get here, the method was called successfully
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("stop method should not reject: \(message ?? "unknown error")")
        })
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testIsAnalyzingAliasPointsToIsRunning() {
        // Test that isRunning (legacy) calls isAnalyzing (primary)
        let expectation = XCTestExpectation(description: "isRunning method should call isAnalyzing")
        
        analyzer.isRunning(resolve: { result in
            // Should return a boolean value
            XCTAssertNotNil(result)
            if let boolResult = result as? Bool {
                // The result should be a boolean (false since we haven't started)
                XCTAssertFalse(boolResult)
            }
            expectation.fulfill()
        }, reject: { code, message, error in
            XCTFail("isRunning method should not reject: \(message ?? "unknown error")")
        })
        
        wait(for: [expectation], timeout: 1.0)
    }
}
import Foundation
import React

// Bridge Method Validation Script
// This script validates that all required React Native bridge methods are properly implemented

class BridgeMethodValidator {
    
    // MARK: - Validation Methods
    
    static func validateModuleName() -> (isValid: Bool, message: String) {
        let moduleName = RealtimeAudioAnalyzer.moduleName()
        
        // Check if moduleName returns a non-nil string
        guard let name = moduleName, !name.isEmpty else {
            return (false, "moduleName() returned nil or empty string")
        }
        
        // Check if it's a valid module name (non-empty, reasonable length)
        if name.count < 3 || name.count > 100 {
            return (false, "moduleName() returned invalid length: \(name.count)")
        }
        
        return (true, "moduleName() returns valid string: '\(name)'")
    }
    
    static func validateRequiresMainQueueSetup() -> (isValid: Bool, message: String) {
        let requiresMainQueue = RealtimeAudioAnalyzer.requiresMainQueueSetup()
        
        // This should return a boolean value (true or false are both valid)
        // The method signature should match the parent class
        return (true, "requiresMainQueueSetup() returns: \(requiresMainQueue)")
    }
    
    static func validateSupportedEvents() -> (isValid: Bool, message: String) {
        // Create a temporary instance to test the instance method
        let analyzer = RealtimeAudioAnalyzer()
        let events = analyzer.supportedEvents()
        
        // Check if supportedEvents returns a non-nil array
        guard let eventArray = events else {
            return (false, "supportedEvents() returned nil")
        }
        
        // Check if array contains expected events
        let expectedEvents = ["RealtimeAudioAnalyzer:onData", "AudioAnalysisData"]
        let hasExpectedEvents = expectedEvents.allSatisfy { eventArray.contains($0) }
        
        if !hasExpectedEvents {
            return (false, "supportedEvents() missing expected events. Got: \(eventArray)")
        }
        
        return (true, "supportedEvents() returns valid array with \(eventArray.count) events: \(eventArray)")
    }
    
    static func validateMethodQueue() -> (isValid: Bool, message: String) {
        // Create a temporary instance to test the instance method
        let analyzer = RealtimeAudioAnalyzer()
        let queue = analyzer.methodQueue()
        
        // Check if methodQueue returns a non-nil DispatchQueue
        guard let dispatchQueue = queue else {
            return (false, "methodQueue() returned nil")
        }
        
        // Verify it's a valid DispatchQueue (we can't easily test the specific queue type without more complex setup)
        return (true, "methodQueue() returns valid DispatchQueue: \(dispatchQueue)")
    }
    
    // MARK: - Run All Validations
    
    static func runAllValidations() -> [(test: String, result: (isValid: Bool, message: String))] {
        return [
            ("moduleName", validateModuleName()),
            ("requiresMainQueueSetup", validateRequiresMainQueueSetup()),
            ("supportedEvents", validateSupportedEvents()),
            ("methodQueue", validateMethodQueue())
        ]
    }
    
    static func printValidationResults() {
        print("🔍 Bridge Method Validation Results")
        print("==================================")
        
        let results = runAllValidations()
        var allPassed = true
        
        for (test, result) in results {
            let status = result.isValid ? "✅ PASS" : "❌ FAIL"
            print("\(status) \(test): \(result.message)")
            if !result.isValid {
                allPassed = false
            }
        }
        
        print("==================================")
        print(allPassed ? "🎉 All bridge methods are valid!" : "⚠️  Some bridge methods need attention")
    }
}
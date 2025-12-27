#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE (RealtimeAudioAnalyzer, RCTEventEmitter)

RCT_EXTERN_METHOD(start : (NSDictionary *)options withResolver : (
    RCTPromiseResolveBlock)resolve withRejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop : (RCTPromiseResolveBlock)
                      resolve withRejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isRunning : (RCTPromiseResolveBlock)
                      resolve withRejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setSmoothing : (BOOL)enabled factor : (float)
                      factor withResolver : (RCTPromiseResolveBlock)
                          resolve withRejecter : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setFftConfig : (int)fftSize downsampleBins : (int)
                      downsampleBins withResolver : (RCTPromiseResolveBlock)
                          resolve withRejecter : (RCTPromiseRejectBlock)reject)

@end

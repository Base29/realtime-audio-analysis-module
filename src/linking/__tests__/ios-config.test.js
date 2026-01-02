import * as fs from 'fs';
import * as path from 'path';
import { IOSConfigManager, configurePodfile, validateIOSProject } from '../ios-config';
// Mock fs module for testing
jest.mock('fs');
const mockFs = fs;
describe('IOSConfigManager', () => {
    let iosConfigManager;
    const mockProjectRoot = '/mock/project';
    const mockModuleConfig = {
        name: 'react-native-realtime-audio-analysis',
        packageName: 'com.realtimeaudio',
        className: 'RealtimeAudioAnalyzerPackage',
        modulePath: '/mock/module',
        platform: 'both'
    };
    beforeEach(() => {
        iosConfigManager = new IOSConfigManager();
        jest.clearAllMocks();
    });
    describe('configurePodfile', () => {
        const mockPodfilePath = path.join(mockProjectRoot, 'ios', 'Podfile');
        it('should configure Podfile with pod reference', () => {
            const mockPodfileContent = `
platform :ios, '11.0'

target 'MyApp' do
  use_react_native!
  
  pod 'React-Core', :path => '../node_modules/react-native/'
end
`;
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockPodfileContent);
            mockFs.writeFileSync.mockImplementation(() => { });
            const result = iosConfigManager.configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(true);
            expect(result.message).toContain('Successfully configured Podfile');
            expect(result.modifiedFiles).toEqual([mockPodfilePath]);
            // Verify backup was created
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(`${mockPodfilePath}.backup`, mockPodfileContent);
            // Verify modified content was written
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockPodfilePath, expect.stringContaining("pod 'react-native-realtime-audio-analysis', :path => '../../module'"));
        });
        it('should return success if already configured', () => {
            const mockPodfileContent = `
platform :ios, '11.0'

target 'MyApp' do
  pod 'react-native-realtime-audio-analysis', :path => '../module'
end
`;
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockPodfileContent);
            const result = iosConfigManager.configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Podfile already configured');
            expect(result.modifiedFiles).toEqual([]);
        });
        it('should return error when Podfile not found', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = iosConfigManager.configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Podfile not found');
            expect(result.error).toContain('Could not locate Podfile');
        });
        it('should handle Podfile without target block', () => {
            const mockPodfileContent = `
platform :ios, '11.0'

pod 'React-Core', :path => '../node_modules/react-native/'
`;
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockPodfileContent);
            mockFs.writeFileSync.mockImplementation(() => { });
            const result = iosConfigManager.configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(true);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockPodfilePath, expect.stringContaining("pod 'react-native-realtime-audio-analysis', :path => '../../module'"));
        });
        it('should handle empty Podfile', () => {
            const mockPodfileContent = '';
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockPodfileContent);
            mockFs.writeFileSync.mockImplementation(() => { });
            const result = iosConfigManager.configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(true);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockPodfilePath, expect.stringContaining("pod 'react-native-realtime-audio-analysis', :path => '../../module'"));
        });
    });
    describe('validateIOSProject', () => {
        it('should validate correct iOS project structure', () => {
            const iosPath = path.join(mockProjectRoot, 'ios');
            const podfilePath = path.join(iosPath, 'Podfile');
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === iosPath || pathStr === podfilePath;
            });
            mockFs.readFileSync.mockReturnValue('platform :ios, "11.0"');
            const result = iosConfigManager.validateIOSProject(mockProjectRoot);
            expect(result.success).toBe(true);
            expect(result.message).toBe('iOS project is ready for configuration');
        });
        it('should return error when iOS directory not found', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = iosConfigManager.validateIOSProject(mockProjectRoot);
            expect(result.success).toBe(false);
            expect(result.message).toBe('iOS project directory not found');
        });
        it('should return error when Podfile not found', () => {
            const iosPath = path.join(mockProjectRoot, 'ios');
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === iosPath;
            });
            const result = iosConfigManager.validateIOSProject(mockProjectRoot);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Podfile not found');
        });
    });
    describe('getPodfileInfo', () => {
        it('should return Podfile information when exists', () => {
            const mockPodfilePath = path.join(mockProjectRoot, 'ios', 'Podfile');
            const mockContent = `
platform :ios, '11.0'

target 'MyApp' do
  pod 'React-Core', :path => '../node_modules/react-native/'
  pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'
end
`;
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockContent);
            const info = iosConfigManager.getPodfileInfo(mockProjectRoot);
            expect(info.exists).toBe(true);
            expect(info.path).toBe(mockPodfilePath);
            expect(info.content).toBe(mockContent);
            expect(info.pods).toEqual(['React-Core', 'RNVectorIcons']);
        });
        it('should return exists false when Podfile not found', () => {
            mockFs.existsSync.mockReturnValue(false);
            const info = iosConfigManager.getPodfileInfo(mockProjectRoot);
            expect(info.exists).toBe(false);
            expect(info.path).toBeUndefined();
        });
    });
});
describe('Convenience functions', () => {
    const mockModuleConfig = {
        name: 'react-native-realtime-audio-analysis',
        packageName: 'com.realtimeaudio',
        className: 'RealtimeAudioAnalyzerPackage',
        modulePath: '/mock/module',
        platform: 'both'
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('configurePodfile', () => {
        it('should configure Podfile using convenience function', () => {
            const mockProjectRoot = '/mock/project';
            const mockPodfilePath = path.join(mockProjectRoot, 'ios', 'Podfile');
            const mockContent = 'platform :ios, "11.0"';
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === path.join(mockProjectRoot, 'ios') ||
                    pathStr === mockPodfilePath;
            });
            mockFs.readFileSync.mockReturnValue(mockContent);
            mockFs.writeFileSync.mockImplementation(() => { });
            const result = configurePodfile(mockProjectRoot, mockModuleConfig);
            expect(result.success).toBe(true);
        });
    });
    describe('validateIOSProject', () => {
        it('should validate iOS project using convenience function', () => {
            const mockProjectRoot = '/mock/project';
            const iosPath = path.join(mockProjectRoot, 'ios');
            const podfilePath = path.join(iosPath, 'Podfile');
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === iosPath || pathStr === podfilePath;
            });
            mockFs.readFileSync.mockReturnValue('platform :ios, "11.0"');
            const result = validateIOSProject(mockProjectRoot);
            expect(result.success).toBe(true);
        });
    });
});

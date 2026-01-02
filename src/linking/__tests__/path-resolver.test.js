import * as fs from 'fs';
import * as path from 'path';
import { PathResolver, detectModule } from '../path-resolver';
// Mock fs module for testing
jest.mock('fs');
const mockFs = fs;
describe('PathResolver', () => {
    let pathResolver;
    const mockProjectRoot = '/mock/project';
    beforeEach(() => {
        pathResolver = new PathResolver();
        jest.clearAllMocks();
    });
    describe('detectModuleLocation', () => {
        it('should find module in node_modules', () => {
            const modulePath = path.join(mockProjectRoot, 'node_modules', 'react-native-realtime-audio-analysis');
            const androidPath = path.join(modulePath, 'android');
            const srcMainPath = path.join(androidPath, 'src', 'main');
            const javaPath = path.join(srcMainPath, 'java');
            // Mock file system structure
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === modulePath ||
                    pathStr === androidPath ||
                    pathStr === path.join(androidPath, 'build.gradle') ||
                    pathStr === srcMainPath ||
                    pathStr === javaPath;
            });
            mockFs.statSync.mockReturnValue({ isDirectory: () => true });
            mockFs.readdirSync.mockReturnValue(['RealtimeAudioAnalyzer.swift']);
            const result = pathResolver.detectModuleLocation(mockProjectRoot);
            expect(result.success).toBe(true);
            expect(result.modulePath).toBe(modulePath);
            expect(result.androidProjectPath).toBe(androidPath);
        });
        it('should return error when module not found', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = pathResolver.detectModuleLocation(mockProjectRoot);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Module \'react-native-realtime-audio-analysis\' not found');
        });
    });
    describe('validateModulePath', () => {
        it('should validate correct Android project structure', () => {
            const modulePath = '/mock/module';
            const androidPath = path.join(modulePath, 'android');
            const srcMainPath = path.join(androidPath, 'src', 'main');
            const javaPath = path.join(srcMainPath, 'java');
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === modulePath ||
                    pathStr === androidPath ||
                    pathStr === path.join(androidPath, 'build.gradle') ||
                    pathStr === srcMainPath ||
                    pathStr === javaPath;
            });
            mockFs.statSync.mockReturnValue({ isDirectory: () => true });
            mockFs.readdirSync.mockReturnValue(['RealtimeAudioAnalyzer.swift']);
            const result = pathResolver.validateModulePath(modulePath);
            expect(result.success).toBe(true);
            expect(result.androidProjectPath).toBe(androidPath);
        });
        it('should return error for non-existent path', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = pathResolver.validateModulePath('/non/existent/path');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Module path does not exist');
        });
    });
    describe('createModuleConfig', () => {
        it('should create correct module config for both platforms', () => {
            const pathResult = {
                success: true,
                modulePath: '/mock/module',
                androidProjectPath: '/mock/module/android',
                iosProjectPath: '/mock/module/ios'
            };
            const config = pathResolver.createModuleConfig(pathResult);
            expect(config).toEqual({
                name: 'react-native-realtime-audio-analysis',
                packageName: 'com.realtimeaudio',
                className: 'RealtimeAudioAnalyzerPackage',
                modulePath: '/mock/module',
                platform: 'both'
            });
        });
        it('should return null for failed path result', () => {
            const pathResult = {
                success: false,
                error: 'Module not found'
            };
            const config = pathResolver.createModuleConfig(pathResult);
            expect(config).toBeNull();
        });
    });
});
describe('Convenience functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('detectModule', () => {
        it('should detect module using convenience function', () => {
            const modulePath = path.join('/mock/project', 'node_modules', 'react-native-realtime-audio-analysis');
            const androidPath = path.join(modulePath, 'android');
            const srcMainPath = path.join(androidPath, 'src', 'main');
            const javaPath = path.join(srcMainPath, 'java');
            mockFs.existsSync.mockImplementation((filePath) => {
                const pathStr = filePath.toString();
                return pathStr === modulePath ||
                    pathStr === androidPath ||
                    pathStr === path.join(androidPath, 'build.gradle') ||
                    pathStr === srcMainPath ||
                    pathStr === javaPath;
            });
            mockFs.statSync.mockReturnValue({ isDirectory: () => true });
            mockFs.readdirSync.mockReturnValue(['RealtimeAudioAnalyzer.swift']);
            const result = detectModule('/mock/project');
            expect(result.success).toBe(true);
            expect(result.modulePath).toBe(modulePath);
        });
    });
});

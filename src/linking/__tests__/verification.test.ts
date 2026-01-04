import * as fs from 'fs';
import * as path from 'path';
import { ModuleLinkingVerifier, verifyModuleLinking, generateDiagnostics } from '../verification';

// Type alias for compatibility
type PathLikeCompat = fs.PathOrFileDescriptor;

// Mock fs module for testing
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ModuleLinkingVerifier', () => {
  let verifier: ModuleLinkingVerifier;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    verifier = new ModuleLinkingVerifier();
    jest.clearAllMocks();
  });

  describe('verifyModuleLinking', () => {
    it('should return success when module is properly configured', async () => {
      // Mock module detection
      const modulePath = path.join(mockProjectRoot, 'node_modules', 'react-native-realtime-audio-analysis');
      const androidPath = path.join(modulePath, 'android');
      const mainAppPath = path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'example', 'MainApplication.kt');
      
      mockFs.existsSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        return pathStr === modulePath ||
               pathStr === androidPath ||
               pathStr === path.join(androidPath, 'build.gradle') ||
               pathStr === path.join(androidPath, 'src', 'main') ||
               pathStr === path.join(androidPath, 'src', 'main', 'java') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'example') ||
               pathStr === mainAppPath ||
               pathStr === path.join(mockProjectRoot, 'android', 'settings.gradle') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'build.gradle') ||
               pathStr === path.join(mockProjectRoot, 'package.json') ||
               pathStr === path.join(modulePath, 'package.json') ||
               pathStr === path.join(modulePath, 'index.js');
      });

      mockFs.statSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('MainApplication.kt') || pathStr.includes('MainApplication.java')) {
          return { isDirectory: () => false } as any;
        }
        return { isDirectory: () => true } as any;
      });
      
      mockFs.readdirSync.mockImplementation((dirPath: fs.PathLike) => {
        const pathStr = dirPath.toString();
        if (pathStr.includes('java/com/example')) {
          return ['MainApplication.kt'] as any;
        }
        if (pathStr.includes('java/com')) {
          return ['example'] as any;
        }
        if (pathStr.includes('java')) {
          return ['com'] as any;
        }
        if (pathStr.includes('main')) {
          return ['java'] as any;
        }
        if (pathStr.includes('src')) {
          return ['main'] as any;
        }
        return ['RealtimeAudioAnalyzer.swift'] as any;
      });

      // Mock file contents
      mockFs.readFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('MainApplication.kt')) {
          return `
            package com.example
            import com.realtimeaudio.RealtimeAudioAnalyzerPackage
            
            class MainApplication : Application(), ReactApplication {
              override fun getPackages(): List<ReactPackage> {
                return Arrays.asList(
                  MainReactPackage(),
                  RealtimeAudioAnalyzerPackage()
                )
              }
            }
          `;
        }
        if (pathStr.includes('settings.gradle')) {
          return `
            include ':react-native-realtime-audio-analysis'
            project(':react-native-realtime-audio-analysis').projectDir = new File('../node_modules/react-native-realtime-audio-analysis/android')
          `;
        }
        if (pathStr.includes('build.gradle')) {
          return `
            dependencies {
              implementation project(':react-native-realtime-audio-analysis')
            }
          `;
        }
        if (pathStr.includes('package.json')) {
          return JSON.stringify({
            name: 'test-project',
            dependencies: {
              'react-native-realtime-audio-analysis': '1.0.0'
            },
            main: 'index.js'
          });
        }
        return '';
      });

      const result = await verifier.verifyModuleLinking(mockProjectRoot);

      expect(result.success).toBe(true);
      expect(result.details.moduleFound).toBe(true);
      expect(result.details.androidConfigured).toBe(true);
      expect(result.details.registrationVerified).toBe(true);
    });

    it('should return failure when module is not found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await verifier.verifyModuleLinking(mockProjectRoot);

      expect(result.success).toBe(false);
      expect(result.details.moduleFound).toBe(false);
      expect(result.errors?.[0]).toContain('Module \'react-native-realtime-audio-analysis\' not found');
    });

    it('should detect missing package registration', async () => {
      // Mock module detection
      const modulePath = path.join(mockProjectRoot, 'node_modules', 'react-native-realtime-audio-analysis');
      const androidPath = path.join(modulePath, 'android');
      const mainAppPath = path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'example', 'MainApplication.kt');
      
      mockFs.existsSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        return pathStr === modulePath ||
               pathStr === androidPath ||
               pathStr === path.join(androidPath, 'build.gradle') ||
               pathStr === path.join(androidPath, 'src', 'main') ||
               pathStr === path.join(androidPath, 'src', 'main', 'java') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com') ||
               pathStr === path.join(mockProjectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'example') ||
               pathStr === mainAppPath ||
               pathStr === path.join(mockProjectRoot, 'package.json') ||
               pathStr === path.join(modulePath, 'package.json') ||
               pathStr === path.join(modulePath, 'index.js');
      });

      mockFs.statSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('MainApplication.kt') || pathStr.includes('MainApplication.java')) {
          return { isDirectory: () => false } as any;
        }
        return { isDirectory: () => true } as any;
      });
      
      mockFs.readdirSync.mockImplementation((dirPath: fs.PathLike) => {
        const pathStr = dirPath.toString();
        if (pathStr.includes('java/com/example')) {
          return ['MainApplication.kt'] as any;
        }
        if (pathStr.includes('java/com')) {
          return ['example'] as any;
        }
        if (pathStr.includes('java')) {
          return ['com'] as any;
        }
        if (pathStr.includes('main')) {
          return ['java'] as any;
        }
        if (pathStr.includes('src')) {
          return ['main'] as any;
        }
        return ['RealtimeAudioAnalyzer.swift'] as any;
      });

      // Mock MainApplication without proper registration
      mockFs.readFileSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('MainApplication.kt')) {
          return `
            package com.example
            
            class MainApplication : Application(), ReactApplication {
              override fun getPackages(): List<ReactPackage> {
                return Arrays.asList(
                  MainReactPackage()
                )
              }
            }
          `;
        }
        if (pathStr.includes('package.json')) {
          return JSON.stringify({
            name: 'test-project',
            main: 'index.js'
          });
        }
        return '';
      });

      const result = await verifier.verifyModuleLinking(mockProjectRoot);

      expect(result.success).toBe(false);
      expect(result.details.registrationVerified).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([
        expect.stringContaining('Package import missing'),
        expect.stringContaining('Package not registered')
      ]));
    });
  });

  describe('generateDiagnostics', () => {
    it('should generate comprehensive diagnostics', async () => {
      const modulePath = path.join(mockProjectRoot, 'node_modules', 'react-native-realtime-audio-analysis');
      const androidPath = path.join(modulePath, 'android');
      
      mockFs.existsSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        return pathStr === modulePath ||
               pathStr === androidPath ||
               pathStr === path.join(androidPath, 'build.gradle') ||
               pathStr === path.join(androidPath, 'src', 'main') ||
               pathStr === path.join(androidPath, 'src', 'main', 'java') ||
               pathStr === path.join(mockProjectRoot, 'package.json');
      });

      mockFs.statSync.mockImplementation((filePath: PathLikeCompat) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('MainApplication.kt') || pathStr.includes('MainApplication.java')) {
          return { isDirectory: () => false } as any;
        }
        return { isDirectory: () => true } as any;
      });
      mockFs.readdirSync.mockReturnValue(['RealtimeAudioAnalyzer.swift'] as any);
      mockFs.readFileSync.mockImplementation((filePath: PathLikeCompat) => {
        if (filePath.toString().includes('package.json')) {
          return JSON.stringify({
            name: 'test-project',
            dependencies: {
              'react-native': '0.83.1'
            }
          });
        }
        return '';
      });

      const diagnostics = await verifier.generateDiagnostics(mockProjectRoot);

      expect(diagnostics.projectRoot).toBe(mockProjectRoot);
      expect(diagnostics.moduleConfig).toBeDefined();
      expect(diagnostics.moduleConfig?.name).toBe('react-native-realtime-audio-analysis');
      expect(diagnostics.buildSystemInfo).toBeDefined();
      expect(diagnostics.buildSystemInfo?.reactNativeVersion).toBe('0.83.1');
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyModuleLinking', () => {
    it('should work as convenience function', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await verifyModuleLinking('/mock/project');

      expect(result.success).toBe(false);
      expect(result.details.moduleFound).toBe(false);
    });
  });

  describe('generateDiagnostics', () => {
    it('should work as convenience function', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const diagnostics = await generateDiagnostics('/mock/project');

      expect(diagnostics.projectRoot).toBe('/mock/project');
    });
  });
});
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from './path-resolver';
export class ManualLinkingGuideGenerator {
  constructor() {
    _defineProperty(this, "pathResolver", void 0);
    this.pathResolver = new PathResolver();
  }
  /**
   * Generates a complete manual linking guide
   */
  generateGuide(options) {
    const sections = [];
    // Introduction
    sections.push(this.generateIntroduction(options));
    // Prerequisites
    sections.push(this.generatePrerequisites(options));
    // Platform-specific sections
    if (options.platform === 'android' || options.platform === 'both') {
      sections.push(...this.generateAndroidSections(options));
    }
    if (options.platform === 'ios' || options.platform === 'both') {
      sections.push(...this.generateIOSSections(options));
    }
    // Verification
    if (options.includeVerification) {
      sections.push(this.generateVerificationSection(options));
    }
    // Troubleshooting
    if (options.includeTroubleshooting) {
      sections.push(this.generateTroubleshootingSection(options));
    }
    // Next steps
    sections.push(this.generateNextStepsSection(options));
    // Format the guide
    return this.formatGuide(sections, options.outputFormat);
  }
  /**
   * Generates introduction section
   */
  generateIntroduction(options) {
    const platformText = options.platform === 'both' ? 'Android and iOS' : options.platform === 'android' ? 'Android' : 'iOS';
    const content = `
This guide will walk you through manually linking the react-native-realtime-audio-analysis module to your React Native project for ${platformText}.

**Module Information:**
- Name: ${options.moduleConfig.name}
- Package: ${options.moduleConfig.packageName}
- Class: ${options.moduleConfig.className}
- Location: ${options.moduleConfig.modulePath}
- Platform Support: ${options.moduleConfig.platform}

**Important:** This guide assumes you have already installed the module in your project. If you haven't, please install it first using npm or yarn.
`;
    return {
      title: 'Manual Linking Guide',
      content: content.trim()
    };
  }
  /**
   * Generates prerequisites section
   */
  generatePrerequisites(options) {
    const content = `
Before starting the manual linking process, ensure you have:

1. **React Native Project**: A working React Native project (version 0.60+)
2. **Module Installed**: The react-native-realtime-audio-analysis module installed in your project
3. **Development Environment**: Properly configured development environment for your target platform(s)
4. **Backup**: Create a backup of your project before making changes

**Verify Module Installation:**
Check that the module exists at: \`${options.moduleConfig.modulePath}\`

**Project Structure:**
Your React Native project should have the following structure:
\`\`\`
${options.projectRoot}/
├── android/          # Android project files
├── ios/             # iOS project files (if targeting iOS)
├── src/             # Your React Native source code
└── package.json     # Project dependencies
\`\`\`
`;
    return {
      title: 'Prerequisites',
      content: content.trim()
    };
  }
  /**
   * Generates Android-specific sections
   */
  generateAndroidSections(options) {
    const sections = [];
    // Android MainApplication configuration
    sections.push({
      title: 'Android: Configure MainApplication',
      platform: 'android',
      content: this.generateAndroidMainApplicationGuide(options)
    });
    // Android build configuration
    sections.push({
      title: 'Android: Configure Build Files',
      platform: 'android',
      content: this.generateAndroidBuildGuide(options)
    });
    return sections;
  }
  /**
   * Generates Android MainApplication configuration guide
   */
  generateAndroidMainApplicationGuide(options) {
    return `
**Step 1: Locate MainApplication File**

Find your MainApplication file, typically located at:
\`android/app/src/main/java/com/yourproject/MainApplication.kt\`
or
\`android/app/src/main/java/com/yourproject/MainApplication.java\`

**Step 2: Add Import Statement**

Add the following import statement at the top of your MainApplication file, after the existing imports:

\`\`\`kotlin
import ${options.moduleConfig.packageName}.${options.moduleConfig.className}
\`\`\`

**Step 3: Register the Package**

In the \`getPackages()\` method, add the package to the list:

\`\`\`kotlin
override fun getPackages(): ReactPackageList {
    return PackageList(this).apply {
        // Add this line:
        add(${options.moduleConfig.className}())
    }
}
\`\`\`

Or if using the older format:

\`\`\`kotlin
override fun getPackages(): List<ReactPackage> {
    return Arrays.asList<ReactPackage>(
        MainReactPackage(),
        // Add this line:
        ${options.moduleConfig.className}()
    )
}
\`\`\`

**Complete Example:**

\`\`\`kotlin
package com.yourproject

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
// Add this import:
import ${options.moduleConfig.packageName}.${options.moduleConfig.className}

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Add this line:
                    add(${options.moduleConfig.className}())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }
        ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }
}
\`\`\`
`.trim();
  }
  /**
   * Generates Android build configuration guide
   */
  generateAndroidBuildGuide(options) {
    const androidDir = path.join(options.projectRoot, 'android');
    const relativePath = path.relative(androidDir, path.join(options.moduleConfig.modulePath, 'android'));
    const projectName = `:${options.moduleConfig.name}`;
    return `
**Step 1: Configure settings.gradle**

Open \`android/settings.gradle\` and add the following lines at the end:

\`\`\`gradle
include '${projectName}'
project('${projectName}').projectDir = new File('${relativePath}')
\`\`\`

**Step 2: Configure app/build.gradle**

Open \`android/app/build.gradle\` and add the module dependency in the \`dependencies\` block:

\`\`\`gradle
dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-native:+"
    
    // Add this line:
    implementation project('${projectName}')
    
    // ... other dependencies
}
\`\`\`

**Step 3: Verify Configuration**

Your \`settings.gradle\` should now include:
\`\`\`gradle
rootProject.name = 'YourProject'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Added for react-native-realtime-audio-analysis:
include '${projectName}'
project('${projectName}').projectDir = new File('${relativePath}')
\`\`\`

**Step 4: Clean and Rebuild**

After making these changes, clean your build:

\`\`\`bash
cd android
./gradlew clean
cd ..
\`\`\`
`.trim();
  }
  /**
   * Generates iOS-specific sections
   */
  generateIOSSections(options) {
    const sections = [];
    // iOS Podfile configuration
    sections.push({
      title: 'iOS: Configure Podfile',
      platform: 'ios',
      content: this.generateIOSPodfileGuide(options)
    });
    return sections;
  }
  /**
   * Generates iOS Podfile configuration guide
   */
  generateIOSPodfileGuide(options) {
    const iosDir = path.join(options.projectRoot, 'ios');
    const relativePath = path.relative(iosDir, options.moduleConfig.modulePath);
    return `
**Step 1: Open Podfile**

Navigate to your iOS directory and open the Podfile:
\`\`\`bash
cd ios
open Podfile
\`\`\`

**Step 2: Add Pod Reference**

Add the following line inside your target block:

\`\`\`ruby
target 'YourProjectName' do
  config = use_native_modules!

  # ... existing pods

  # Add this line:
  pod '${options.moduleConfig.name}', :path => '${relativePath}'

  # ... rest of your configuration
end
\`\`\`

**Step 3: Install Pods**

Run pod install to install the new dependency:

\`\`\`bash
pod install
\`\`\`

**Step 4: Verify Installation**

After running \`pod install\`, you should see output similar to:

\`\`\`
Analyzing dependencies
Downloading dependencies
Installing ${options.moduleConfig.name} (1.0.0)
Generating Pods project
Integrating client project
\`\`\`

**Complete Podfile Example:**

\`\`\`ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '11.0'
install! 'cocoapods', :deterministic_uuids => false

target 'YourProjectName' do
  config = use_native_modules!

  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    :flipper_configuration => FlipperConfiguration.enabled,
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Add this line:
  pod '${options.moduleConfig.name}', :path => '${relativePath}'

  target 'YourProjectNameTests' do
    inherit! :complete
  end

  post_install do |installer|
    react_native_post_install(installer)
    __apply_Xcode_12_5_M1_post_install_workaround(installer)
  end
end
\`\`\`

**Important Notes:**
- Always use \`.xcworkspace\` file (not \`.xcodeproj\`) after running \`pod install\`
- If you encounter issues, try \`pod install --repo-update\`
- Clean your build folder in Xcode (Product → Clean Build Folder) after installation
`.trim();
  }
  /**
   * Generates verification section
   */
  generateVerificationSection(options) {
    const content = `
After completing the manual linking steps, verify that everything is working correctly:

**Step 1: Test Module Import**

Create a test file or add to your existing code:

\`\`\`javascript
import RealtimeAudioAnalyzer from '${options.moduleConfig.name}';

// Test basic import
console.log('Module imported:', RealtimeAudioAnalyzer);

// Test module methods (if available)
try {
  // Replace with actual module methods
  const result = RealtimeAudioAnalyzer.isAvailable();
  console.log('Module available:', result);
} catch (error) {
  console.error('Module test failed:', error);
}
\`\`\`

**Step 2: Build and Run**

${options.platform === 'android' || options.platform === 'both' ? `
**For Android:**
\`\`\`bash
npx react-native run-android
\`\`\`

Check the Metro bundler and device logs for any errors.
` : ''}

${options.platform === 'ios' || options.platform === 'both' ? `
**For iOS:**
\`\`\`bash
npx react-native run-ios
\`\`\`

Or open the \`.xcworkspace\` file in Xcode and build from there.
` : ''}

**Step 3: Check Logs**

Look for these success indicators in your logs:
- No import errors when the app starts
- Module registration messages (if any)
- Successful method calls to the module

**Step 4: Automated Verification**

If you have the CLI tool installed, you can run:
\`\`\`bash
npx rn-module-link verify
\`\`\`

This will automatically check your configuration and report any issues.
`;
    return {
      title: 'Verification Steps',
      content: content.trim()
    };
  }
  /**
   * Generates troubleshooting section
   */
  generateTroubleshootingSection(options) {
    const content = `
If you encounter issues during or after linking, try these solutions:

## Common Issues

### "Module not found" or Import Errors

**Symptoms:**
- \`Unable to resolve module\` errors
- \`Module does not exist\` errors

**Solutions:**
1. Verify the module is installed: \`npm list ${options.moduleConfig.name}\`
2. Clear Metro cache: \`npx react-native start --reset-cache\`
3. Reinstall node_modules: \`rm -rf node_modules && npm install\`
4. Check that the module's main entry point exists

${options.platform === 'android' || options.platform === 'both' ? `
### Android Build Errors

**Symptoms:**
- Gradle build failures
- \`Package does not exist\` errors
- \`Cannot resolve symbol\` errors

**Solutions:**
1. **Clean Android build:**
   \`\`\`bash
   cd android
   ./gradlew clean
   cd ..
   \`\`\`

2. **Verify settings.gradle:**
   - Check that the include statement is correct
   - Verify the project path exists
   - Ensure no typos in the project name

3. **Check MainApplication.kt:**
   - Verify the import statement is correct
   - Ensure the package is added to getPackages()
   - Check for syntax errors

4. **Gradle sync issues:**
   - Open Android Studio
   - File → Sync Project with Gradle Files
   - Check for any sync errors

5. **NDK/CMake issues (if applicable):**
   - Ensure NDK is installed
   - Check CMakeLists.txt configuration
   - Verify native library paths
` : ''}

${options.platform === 'ios' || options.platform === 'both' ? `
### iOS Build Errors

**Symptoms:**
- Pod install failures
- Xcode build errors
- \`Module not found\` in iOS

**Solutions:**
1. **Clean pod installation:**
   \`\`\`bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   \`\`\`

2. **Update CocoaPods:**
   \`\`\`bash
   sudo gem install cocoapods
   pod repo update
   \`\`\`

3. **Xcode issues:**
   - Clean build folder: Product → Clean Build Folder
   - Delete derived data: Xcode → Preferences → Locations → Derived Data
   - Ensure you're opening .xcworkspace, not .xcodeproj

4. **Pod path issues:**
   - Verify the path in Podfile is correct
   - Check that the module's iOS directory exists
   - Ensure the podspec file is valid

5. **iOS deployment target:**
   - Check minimum iOS version compatibility
   - Update deployment target if needed
` : ''}

### Runtime Errors

**Symptoms:**
- App crashes on module usage
- \`Native module cannot be null\` errors
- Method not found errors

**Solutions:**
1. **Verify registration:**
   - Check that the native module is properly registered
   - Ensure the package is added to the correct location

2. **Rebuild completely:**
   \`\`\`bash
   # Clean everything
   npx react-native start --reset-cache
   ${options.platform === 'android' || options.platform === 'both' ? 'cd android && ./gradlew clean && cd ..' : ''}
   ${options.platform === 'ios' || options.platform === 'both' ? 'cd ios && rm -rf Pods Podfile.lock && pod install && cd ..' : ''}
   
   # Rebuild
   ${options.platform === 'android' || options.platform === 'both' ? 'npx react-native run-android' : ''}
   ${options.platform === 'ios' || options.platform === 'both' ? 'npx react-native run-ios' : ''}
   \`\`\`

3. **Check module compatibility:**
   - Verify React Native version compatibility
   - Check if the module supports your target platform
   - Review module documentation for setup requirements

## Getting Help

If you're still experiencing issues:

1. **Check module documentation:** Look for platform-specific setup instructions
2. **Search existing issues:** Check the module's GitHub issues for similar problems
3. **Enable verbose logging:** Add debug logs to identify where the issue occurs
4. **Use diagnostic tools:** Run \`npx rn-module-link diagnose\` for detailed analysis
5. **Create a minimal reproduction:** Test the module in a fresh React Native project

## Useful Commands

\`\`\`bash
# Reset Metro cache
npx react-native start --reset-cache

# Clean and rebuild Android
cd android && ./gradlew clean && cd .. && npx react-native run-android

# Clean and rebuild iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd .. && npx react-native run-ios

# Check module linking status
npx rn-module-link diagnose

# Verify configuration
npx rn-module-link verify
\`\`\`
`;
    return {
      title: 'Troubleshooting',
      content: content.trim()
    };
  }
  /**
   * Generates next steps section
   */
  generateNextStepsSection(_options) {
    const content = `
Congratulations! You have successfully linked the react-native-realtime-audio-analysis module to your project.

## Next Steps

1. **Test the Integration**
   - Import the module in your React Native code
   - Test basic functionality to ensure everything works
   - Check device logs for any warnings or errors

2. **Read the Documentation**
   - Review the module's API documentation
   - Check for platform-specific usage notes
   - Look for example implementations

3. **Development Workflow**
   - The module is now part of your project's build process
   - Changes to native code will require rebuilding the app
   - JavaScript changes will hot-reload as usual

4. **Production Considerations**
   - Test on both debug and release builds
   - Verify functionality on physical devices
   - Check performance implications

## Useful Resources

- **Module Documentation:** Check the module's README and documentation
- **React Native Docs:** [Linking Libraries](https://reactnative.dev/docs/linking-libraries-ios)
- **Troubleshooting:** Use \`npx rn-module-link diagnose\` for issues
- **Community:** Search Stack Overflow and GitHub issues for help

## Automation

For future projects or team members, consider using the automated linking tool:

\`\`\`bash
# Install the module with linking
npx rn-module-link link

# Or preview changes first
npx rn-module-link link --dry-run

# Get detailed project analysis
npx rn-module-link diagnose
\`\`\`

This will handle all the manual steps automatically and provide verification.
`;
    return {
      title: 'Next Steps',
      content: content.trim()
    };
  }
  /**
   * Formats the guide sections into the final output
   */
  formatGuide(sections, format) {
    if (format === 'markdown') {
      return this.formatAsMarkdown(sections);
    } else {
      return this.formatAsText(sections);
    }
  }
  /**
   * Formats guide as Markdown
   */
  formatAsMarkdown(sections) {
    let output = '';
    for (const section of sections) {
      // Add platform indicator if applicable
      const platformIndicator = section.platform ? ` (${section.platform.toUpperCase()})` : '';
      const optionalIndicator = section.optional ? ' [Optional]' : '';
      output += `# ${section.title}${platformIndicator}${optionalIndicator}\n\n`;
      output += `${section.content}\n\n`;
      output += '---\n\n';
    }
    return output.trim();
  }
  /**
   * Formats guide as plain text
   */
  formatAsText(sections) {
    let output = '';
    for (const section of sections) {
      const platformIndicator = section.platform ? ` (${section.platform.toUpperCase()})` : '';
      const optionalIndicator = section.optional ? ' [Optional]' : '';
      output += `${section.title}${platformIndicator}${optionalIndicator}\n`;
      output += '='.repeat(section.title.length + platformIndicator.length + optionalIndicator.length) + '\n\n';
      output += `${section.content}\n\n`;
      output += '-'.repeat(50) + '\n\n';
    }
    return output.trim();
  }
  /**
   * Saves the guide to a file
   */
  saveGuide(guide, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
    fs.writeFileSync(outputPath, guide, 'utf8');
  }
  /**
   * Generates a guide for a specific project
   */
  generateProjectGuide(projectRoot, platform = 'both', outputPath) {
    // Detect module configuration
    const pathResult = this.pathResolver.detectModuleLocation(projectRoot);
    if (!pathResult.success || !pathResult.modulePath) {
      throw new Error(`Module not found: ${pathResult.error}`);
    }
    const moduleConfig = this.pathResolver.createModuleConfig(pathResult);
    if (!moduleConfig) {
      throw new Error('Failed to create module configuration');
    }
    const options = {
      platform,
      projectRoot,
      moduleConfig,
      outputFormat: 'markdown',
      includeVerification: true,
      includeTroubleshooting: true
    };
    const guide = this.generateGuide(options);
    if (outputPath) {
      this.saveGuide(guide, outputPath);
    }
    return guide;
  }
}
/**
 * Convenience function to generate a manual linking guide
 */
export function generateManualGuide(projectRoot, platform = 'both', outputPath) {
  const generator = new ManualLinkingGuideGenerator();
  return generator.generateProjectGuide(projectRoot, platform, outputPath);
}
//# sourceMappingURL=manual-guide.js.mappingURL=manual-guide.js.map
#!/usr/bin/env ts-node
/**
 * Example TypeScript script demonstrating how to use the module linking verification tools
 */
import { verifyModuleLinking, generateDiagnostics } from '../src/linking';
async function main() {
    const projectRoot = process.argv[2] || process.cwd();
    const moduleName = process.argv[3]; // Optional custom module name
    console.log('🔍 Verifying React Native module linking...');
    console.log(`Project root: ${projectRoot}`);
    try {
        // Run verification
        const result = await verifyModuleLinking(projectRoot, moduleName);
        console.log('\n📋 Verification Results:');
        console.log(`✅ Overall success: ${result.success}`);
        console.log(`📦 Module found: ${result.details.moduleFound}`);
        console.log(`🤖 Android configured: ${result.details.androidConfigured}`);
        console.log(`🍎 iOS configured: ${result.details.iosConfigured}`);
        console.log(`🔧 Build config valid: ${result.details.buildConfigValid}`);
        console.log(`📝 Registration verified: ${result.details.registrationVerified}`);
        console.log(`🧪 Import test passed: ${result.details.importTestPassed}`);
        if (result.errors && result.errors.length > 0) {
            console.log('\n❌ Errors found:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }
        if (result.warnings && result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        // Generate detailed diagnostics
        console.log('\n🔬 Generating detailed diagnostics...');
        const diagnostics = await generateDiagnostics(projectRoot, moduleName);
        console.log('\n📊 Diagnostic Information:');
        if (diagnostics.moduleConfig) {
            console.log(`Module: ${diagnostics.moduleConfig.name}`);
            console.log(`Platform: ${diagnostics.moduleConfig.platform}`);
            console.log(`Path: ${diagnostics.moduleConfig.modulePath}`);
        }
        if (diagnostics.androidDetails) {
            console.log('\n🤖 Android Details:');
            console.log(`  MainApplication found: ${diagnostics.androidDetails.mainApplicationFound}`);
            console.log(`  Package imported: ${diagnostics.androidDetails.packageImported}`);
            console.log(`  Package registered: ${diagnostics.androidDetails.packageRegistered}`);
            console.log(`  Build files valid: ${diagnostics.androidDetails.buildFilesValid}`);
        }
        if (diagnostics.iosDetails) {
            console.log('\n🍎 iOS Details:');
            console.log(`  Podfile found: ${diagnostics.iosDetails.podfileFound}`);
            console.log(`  Pod configured: ${diagnostics.iosDetails.podConfigured}`);
            console.log(`  iOS project valid: ${diagnostics.iosDetails.iosProjectValid}`);
            console.log(`  Pod install needed: ${diagnostics.iosDetails.podInstallNeeded}`);
        }
        if (diagnostics.buildSystemInfo) {
            console.log('\n🛠️  Build System:');
            console.log(`  React Native: ${diagnostics.buildSystemInfo.reactNativeVersion || 'Unknown'}`);
            console.log(`  Node.js: ${diagnostics.buildSystemInfo.nodeVersion || 'Unknown'}`);
        }
        console.log('\n✨ Verification complete!');
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error('\n💥 Verification failed:', error.message);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
export { main };

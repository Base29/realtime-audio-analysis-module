#!/usr/bin/env node

/**
 * TypeScript example script showing how to generate a manual linking guide
 * This can be used as a standalone script or integrated into build processes
 */

import { generateManualGuide } from '../src/linking';

async function main(): Promise<void> {
  try {
    // Configuration
    const projectRoot = process.cwd(); // Current directory
    const platform = (process.argv[2] as 'android' | 'ios' | 'both') || 'both';
    const outputPath = process.argv[3]; // Optional output file path

    console.log('🔗 React Native Module Linking - Manual Guide Generator');
    console.log(`Project: ${projectRoot}`);
    console.log(`Platform: ${platform}`);
    console.log(`Output: ${outputPath || 'console'}`);
    console.log('');

    // Generate the guide
    const guide = generateManualGuide(projectRoot, platform, outputPath);

    if (outputPath) {
      console.log(`✅ Manual linking guide saved to: ${outputPath}`);
    } else {
      console.log('📋 Manual Linking Guide:');
      console.log('');
      console.log(guide);
    }

  } catch (error) {
    console.error('❌ Error generating guide:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Usage examples in comments:
// npx ts-node examples/generate-manual-guide.ts
// npx ts-node examples/generate-manual-guide.ts android
// npx ts-node examples/generate-manual-guide.ts both ./LINKING_GUIDE.md
// npx ts-node examples/generate-manual-guide.ts ios ./docs/ios-linking.md

if (require.main === module) {
  main();
}

export { main };
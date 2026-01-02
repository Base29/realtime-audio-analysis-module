#!/usr/bin/env node

/**
 * Example script showing how to generate a manual linking guide
 * This can be used as a standalone script or integrated into build processes
 */

const path = require('path');
const { generateManualGuide } = require('../lib/commonjs/linking');

async function main() {
  try {
    // Configuration
    const projectRoot = process.cwd(); // Current directory
    const platform = process.argv[2] || 'both'; // android, ios, or both
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
    console.error('❌ Error generating guide:', error.message);
    process.exit(1);
  }
}

// Usage examples in comments:
// node examples/generate-manual-guide.js
// node examples/generate-manual-guide.js android
// node examples/generate-manual-guide.js both ./LINKING_GUIDE.md
// node examples/generate-manual-guide.js ios ./docs/ios-linking.md

if (require.main === module) {
  main();
}

module.exports = { main };
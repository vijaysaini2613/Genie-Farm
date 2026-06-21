const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prepareScript = path.resolve(__dirname, './prepare-edge.js');
const restoreScript = path.resolve(__dirname, './restore-edge.js');

console.log('--- STARTING BUILD PIPELINE ---');

try {
  // 1. Prepare route file for edge compilation
  require(prepareScript);

  // 2. Run standard Next.js build
  console.log('Running standard compiler...');
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Compilation completed successfully!');
} catch (error) {
  console.error('❌ Build failed during compilation step.');
  process.exitCode = 1;
} finally {
  // 3. Always restore local development configuration
  console.log('Restoring local development state...');
  require(restoreScript);
  console.log('--- BUILD PIPELINE COMPLETED ---');
}

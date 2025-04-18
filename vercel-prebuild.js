// Script to modify package.json before building on Vercel
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel pre-build configuration...');

// Path to package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Set environment variables to help with platform-specific dependencies
  process.env.ROLLUP_SKIP_PLATFORM_CHECK = 'true';
  process.env.npm_config_platform = 'neutral';
  process.env.npm_config_arch = 'neutral';
  process.env.npm_config_libc = 'neutral';
  
  // Ensure we have overrides for all platform-specific rollup binaries
  packageJson.overrides = packageJson.overrides || {};
  packageJson.overrides.rollup = packageJson.overrides.rollup || {};
  
  // Map all platform-specific rollup binaries to the Windows version
  // This ensures Vercel's Linux environment can build successfully
  const rollupOverrides = {
    '@rollup/rollup-linux-x64-gnu': 'npm:@rollup/rollup-win32-x64-msvc',
    '@rollup/rollup-linux-x64-musl': 'npm:@rollup/rollup-win32-x64-msvc',
    '@rollup/rollup-linux-arm64-gnu': 'npm:@rollup/rollup-win32-x64-msvc',
    '@rollup/rollup-linux-arm64-musl': 'npm:@rollup/rollup-win32-x64-msvc',
    '@rollup/rollup-darwin-x64': 'npm:@rollup/rollup-win32-x64-msvc',
    '@rollup/rollup-darwin-arm64': 'npm:@rollup/rollup-win32-x64-msvc'
  };
  
  // Apply all overrides
  packageJson.overrides.rollup = {
    ...packageJson.overrides.rollup,
    ...rollupOverrides
  };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json successfully modified for Vercel deployment');
  
  // Create a .npmrc file to set additional npm configuration
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  const npmrcContent = [
    '# NPM configuration for Vercel deployment',
    'npm_config_platform=neutral',
    'npm_config_arch=neutral',
    'npm_config_libc=neutral',
    'platform=neutral',
    'arch=neutral',
    'libc=neutral',
    '',
    '# Skip platform checks for Rollup',
    'rollup-plugin-skip-platform-check=true',
    'ROLLUP_SKIP_PLATFORM_CHECK=true',
    'rollup_skip_nodejs=true',
    'rollup_skip_native=true',
    '',
    '# Disable optional dependencies',
    'optional=false',
    '',
    '# Ignore scripts during installation',
    'ignore-scripts=true',
    '',
    '# Use legacy peer deps resolution',
    'legacy-peer-deps=true'
  ].join('\n');
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('.npmrc file created with platform-neutral settings');
  
} catch (error) {
  console.error('Error modifying package.json:', error);
  process.exit(1);
}
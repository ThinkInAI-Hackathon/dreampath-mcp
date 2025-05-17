#!/usr/bin/env node

/**
 * This script helps users get their DeepPath API key.
 * It opens the DeepPath project settings page in a browser.
 */

const { exec } = require('child_process');
const os = require('os');

console.log('Opening DeepPath project settings page...');
console.log('Please follow these steps:');
console.log('1. Log in to your DeepPath account if needed');
console.log('2. Navigate to Project Settings');
console.log('3. Create a new API key or copy an existing one');
console.log('4. Use this API key in your MCP server configuration');

// Determine the platform and open the browser accordingly
const platform = os.platform();
const url = 'https://app.deeppath.ai/settings/api-keys';

try {
  if (platform === 'darwin') {
    // macOS
    exec(`open "${url}"`);
  } else if (platform === 'win32') {
    // Windows
    exec(`start "${url}"`);
  } else {
    // Linux and others
    exec(`xdg-open "${url}"`);
  }
  
  console.log('\nBrowser should open automatically. If not, please visit:');
  console.log(url);
} catch (error) {
  console.error('Failed to open browser automatically. Please visit:');
  console.error(url);
  console.error('\nError details:', error.message);
}

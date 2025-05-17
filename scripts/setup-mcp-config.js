#!/usr/bin/env node

/**
 * This script helps users set up the MCP server configuration.
 * It creates or updates the MCP settings file for VSCode Claude extension or Claude desktop app.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the absolute path to the build directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const buildPath = path.join(projectRoot, 'build', 'index.js');

// Determine the platform-specific paths
const homedir = os.homedir();
let vscodeConfigPath;
let desktopConfigPath;

if (os.platform() === 'darwin') {
  // macOS
  vscodeConfigPath = path.join(homedir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  desktopConfigPath = path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
} else if (os.platform() === 'win32') {
  // Windows
  vscodeConfigPath = path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  desktopConfigPath = path.join(homedir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
} else {
  // Linux and others
  vscodeConfigPath = path.join(homedir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  desktopConfigPath = path.join(homedir, '.config', 'Claude', 'claude_desktop_config.json');
}

// Ensure the directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Update or create the config file
function updateConfig(configPath, apiKey, baseUrl) {
  ensureDirectoryExists(configPath);

  let config = { mcpServers: {} };

  // Try to read existing config
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(fileContent);
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
    } catch (error) {
      console.error(`Error reading existing config at ${configPath}:`, error.message);
      console.log('Creating a new configuration file...');
    }
  }

  // Add or update the DeepPath MCP server config
  config.mcpServers.deeppath = {
    command: 'node',
    args: [buildPath],
    env: {
      DEEPPATH_API_KEY: apiKey,
      DEEPPATH_BASE_URL: baseUrl
    },
    disabled: false,
    autoApprove: []
  };

  // Write the updated config
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Configuration updated successfully at: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`Error writing config to ${configPath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('DeepPath MCP Server Setup');
  console.log('========================\n');

  rl.question('Enter your DeepPath API key: ', (apiKey) => {
    if (!apiKey) {
      console.error('API key is required. Please run the script again with a valid API key.');
      rl.close();
      return;
    }

    rl.question('Enter the DeepPath base URL (default: http://localhost:3000): ', (baseUrl) => {
      baseUrl = baseUrl || 'http://localhost:3000';

      rl.question('Which application do you want to configure? (1: VSCode Claude Extension, 2: Claude Desktop App, 3: Both): ', (choice) => {
        let success = false;

        if (choice === '1' || choice === '3') {
          success = updateConfig(vscodeConfigPath, apiKey, baseUrl) || success;
        }

        if (choice === '2' || choice === '3') {
          success = updateConfig(desktopConfigPath, apiKey, baseUrl) || success;
        }

        if (success) {
          console.log('\nSetup completed successfully!');
          console.log('You may need to restart your application for the changes to take effect.');
        } else {
          console.error('\nSetup failed. Please check the error messages above.');
        }

        rl.close();
      });
    });
  });
}

main();

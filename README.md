# DeepPath MCP Server

This MCP server integrates with DeepPath's API to provide task and goal management functionality for Anthropic models.

## Features

- Task management (create, get, update)
- Goal management (create, get, update)
- Note management (create, get)
- Automation rules

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Get your DeepPath API key:

You can use the included helper script to open the DeepPath API key page:

```bash
npm run get-api-key
```

4. Configure the MCP server:

You can configure the MCP server manually or use the included setup script:

### Automatic Setup (Recommended)

Run the setup script and follow the prompts:

```bash
npm run setup
```

The script will:

- Ask for your DeepPath API key
- Ask for the DeepPath base URL (default: http://localhost:3000)
- Let you choose which application to configure (VSCode, Claude Desktop, or both)
- Create or update the configuration file(s)

### Manual Setup

For VSCode Claude extension, edit the file at:
`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

For Claude desktop app, edit:
`~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "deeppath": {
      "command": "node",
      "args": ["/absolute/path/to/deeppath-mcp/build/index.js"],
      "env": {
        "DEEPPATH_API_KEY": "dp_your_api_key_here",
        "DEEPPATH_BASE_URL": "http://localhost:3000"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `/absolute/path/to/deeppath-mcp` with the absolute path to this project and `dp_your_api_key_here` with your DeepPath API key.

## Usage

Once configured, the MCP server will be available to Anthropic models. You can use it to:

- Get project information
- Manage tasks (create, get, update)
- Manage goals (create, get, update)
- Manage notes (create, get)
- Get automation rules

Example commands:

- "Create a new task called 'Finish project documentation'"
- "Show me my active goals"
- "Create a note about the project requirements"

## Development and Publishing

### Publishing to npm

The package is available on npm registry as `deeppath-mcp`. You can install it globally:

```bash
npm install -g deeppath-mcp
```

Or use it with npx without installation:

```bash
npx deeppath-mcp
```

### Automatic Publishing

This repo uses GitHub Actions for automatic versioning and publishing to npm following the Git Flow workflow:

1. When a tag with format `v*.*.*` (e.g., v1.2.3) is pushed to the repository, the workflow is triggered
2. The version from the tag is extracted and used to update package.json
3. The project is built and published to npm
4. A GitHub release is automatically created for the tag

To publish a new version:

1. Follow Git Flow process (complete feature branches, merge to develop, create release branch)
2. Merge release branch to master
3. Create and push a tag with proper semantic versioning:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. Alternatively, manually trigger the workflow and specify a version number

Note: Make sure to add your npm token as a GitHub repository secret named `NPM_TOKEN` before using this feature.

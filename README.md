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

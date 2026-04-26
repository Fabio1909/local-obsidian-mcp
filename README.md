# local-obsidian-mcp

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives Claude read access to your Obsidian vaults — no cloud sync, no plugins, no API keys.

## What it does

Exposes two MCP tools Claude can call:

| Tool | Description |
|------|-------------|
| `list_notes` | Lists all `.md` notes across your vaults (optionally filtered by vault name) |
| `read_note` | Reads the full content of a specific note by path |

Ask things like:
- *"What notes do I have about machine learning?"*
- *"Read my note on project planning."*
- *"Summarize everything in my personal vault about fitness."*

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Claude Desktop](https://claude.ai/download) or [Claude Code](https://claude.ai/code)

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/local-obsidian-mcp.git
cd local-obsidian-mcp
npm install
npm run build
```

## Configuration

### 1. Add your vaults

Edit `vaults.json` in the project root:

```json
{
  "vaults": [
    {
      "name": "personal",
      "path": "/absolute/path/to/your/obsidian/vault"
    },
    {
      "name": "work",
      "path": "/absolute/path/to/another/vault"
    }
  ]
}
```

Use the **absolute path** to each vault folder (the folder Obsidian opens, not a subfolder).

### 2. Connect to Claude Desktop

Add this to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/absolute/path/to/local-obsidian-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

### 3. Connect to Claude Code

Run this in the project directory:

```bash
claude mcp add obsidian node /absolute/path/to/local-obsidian-mcp/dist/index.js
```

Or add manually to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/absolute/path/to/local-obsidian-mcp/dist/index.js"]
    }
  }
}
```

## Development

```bash
npm run dev   # watch mode — recompiles on save
npm run build # one-off build
npm start     # run the compiled server directly
```

## Project structure

```
src/
  index.ts   # MCP server, tool handlers
  vault.ts   # filesystem walk, note reading
  config.ts  # loads vaults.json
  types.ts   # shared TypeScript interfaces
vaults.json  # your vault paths (gitignored if you add personal paths)
```

## Privacy

Everything runs locally. No data leaves your machine. Claude reads your notes only when you ask it to, via the tools above.

## Contributing

Issues and PRs welcome. This is an early-stage project — if you hit a bug or want a feature (search, write support, tag filtering, etc.) open an issue.

## License

MIT

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadVaults } from "./config.js";
import { listNotes, readNote } from "./vault.js";

// BOOT 
const server = new Server(
  {
    name: "obsidian-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // tells the SDK: yes, this server has tools
    },
  }
);

const vaults = await loadVaults();
console.error(`Loaded ${vaults.length} vault(s)`);

// HANDLER 1
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [

      {
        name: "list_notes",
        description:
          "Lists all markdown notes across all Obsidian vaults. " +
          "Use this when the user wants to know what notes exist, " +
          "wants to browse their vault, or before searching for specific content.",
        inputSchema: {
          // JSON Schema format — the same standard used across the web
          // to describe the shape of JSON objects.
          type: "object",
          properties: {
            vault: {
              type: "string",
              description:
                "Optional vault name to filter by (e.g. 'personal'). " +
                "If omitted, lists notes from all vaults.",
            },
          },
          required: [], // no required fields — vault is optional
        },
      },

      {
        name: "read_note",
        description:
          "Reads the full content of a specific note. " +
          "Use this when the user asks about a specific note, " +
          "or after list_notes to read a note that looks relevant.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The absolute path to the note file.",
            },
          },
          required: ["path"], // path is mandatory — we can't read without it
        },
      },

    ],
  };
});

// HANDLER 2
server.setRequestHandler(CallToolRequestSchema, async (request) => {

  const { name, arguments: args } = request.params;

  const input = (args ?? {}) as Record<string, unknown>;

  if (name === "list_notes") {
    const vaultFilter = input.vault as string | undefined;

    const targets = vaultFilter
      ? vaults.filter((v) => v.name === vaultFilter)
      : vaults;

    if (targets.length === 0) {
      return {
        content: [{ type: "text", text: `No vault found with name "${vaultFilter}"` }],
      };
    }

    const lines: string[] = [];

    for (const vault of targets) {
      const notes = await listNotes(vault);
      lines.push(`\n## ${vault.name} (${notes.length} notes)\n`);

      for (const note of notes) {
        lines.push(`- ${note.relativePath}  →  ${note.path}`);
      }
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  if (name === "read_note") {
    const path = input.path as string;

    if (!path) {
      return {
        content: [{ type: "text", text: "Error: path is required" }],
      };
    }

    const content = await readNote(path);

    return {
      content: [{ type: "text", text: content }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
  };
});

// --- Connect ---
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server running");


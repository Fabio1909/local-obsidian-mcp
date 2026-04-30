import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadVaults } from "./config.js";
import { listNotes, readNote, searchNotes, createNote, commitVault } from "./vault.js";

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

      {
        name: "search_notes",
        description:
          "Searches Obsidian notes by keyword. Checks note titles by default. " +
          "Set searchContent to true to also search inside note content. " +
          "Use this when the user wants to find notes about a topic.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The keyword to search for (case-insensitive).",
            },
            vault: {
              type: "string",
              description: "Optional vault name to limit search scope.",
            },
            searchContent: {
              type: "boolean",
              description: "If true, also searches inside note content. Default: false.",
            },
            maxResults: {
              type: "number",
              description: "Max notes to return, and max matching lines per note. Default: 20.",
            },
          },
          required: ["query"],
        },
      },

      {
        name: "create_note",
        description:
          "Creates a new markdown note in an Obsidian vault. " +
          "Fails if a note with that name already exists. " +
          "Use this when the user wants to save or write a new note.",
        inputSchema: {
          type: "object",
          properties: {
            vault: {
              type: "string",
              description: "The vault name to write into.",
            },
            filename: {
              type: "string",
              description:
                "Note filename without .md extension. " +
                "Supports subfolders (e.g. 'projects/my-note').",
            },
            content: {
              type: "string",
              description: "The markdown content to write.",
            },
          },
          required: ["vault", "filename", "content"],
        },
      },

      {
        name: "commit_vault",
        description:
          "Commits all pending changes in an Obsidian vault's git repository. " +
          "Stages everything (git add -A) then commits with the provided message. " +
          "Use this after creating or modifying notes to save changes to git.",
        inputSchema: {
          type: "object",
          properties: {
            vault: {
              type: "string",
              description: "The vault name to commit changes in.",
            },
            message: {
              type: "string",
              description: "The git commit message.",
            },
          },
          required: ["vault", "message"],
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

  if (name === "search_notes") {
    const query = input.query as string;
    const vaultFilter = input.vault as string | undefined;
    const searchContent = (input.searchContent as boolean) ?? false;
    const maxResults = (input.maxResults as number) ?? 20;

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
      const results = await searchNotes(vault, query, searchContent, maxResults);

      if (results.length > 0) {
        lines.push(`\n## ${vault.name}\n`);
        for (const result of results) {
          lines.push(`- ${result.note.relativePath}  →  ${result.note.path}`);
          for (const match of result.matches) {
            lines.push(`  > ${match.trim()}`);
          }
        }
      }
    }

    if (lines.length === 0) {
      return {
        content: [{ type: "text", text: `No notes found matching "${query}"` }],
      };
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  if (name === "create_note") {
    const vaultName = input.vault as string;
    const filename = input.filename as string;
    const content = input.content as string;

    const target = vaults.find((v) => v.name === vaultName);

    if (!target) {
      return {
        content: [{ type: "text", text: `No vault found with name "${vaultName}"` }],
      };
    }

    try {
      const path = await createNote(target, filename, content);
      return {
        content: [{ type: "text", text: `Note created: ${path}` }],
      };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        return {
          content: [{ type: "text", text: `Note already exists: ${filename}` }],
        };
      }
      throw err;
    }
  }

  if (name === "commit_vault") {
    const vaultName = input.vault as string;
    const message = input.message as string;

    const target = vaults.find((v) => v.name === vaultName);

    if (!target) {
      return {
        content: [{ type: "text", text: `No vault found with name "${vaultName}"` }],
      };
    }

    try {
      const output = await commitVault(target, message);
      return {
        content: [{ type: "text", text: output || "Committed successfully." }],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Git error: ${msg}` }],
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
  };
});

// --- Connect ---
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server running");


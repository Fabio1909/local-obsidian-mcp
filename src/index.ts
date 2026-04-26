import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadVaults } from "./config.js"
import { listNotes, readNote } from "./vaults.js"

const server = new Server({
  name: "obsidian-mcp", 
  version: "1.0.0",
});

const transport = new StdioServerTransport()

await server.connect(transport)

console.log("connected to the mcp thing")

// Smoke test
const vaults = await loadVaults();
console.error(`Loaded ${vaults.length} vault(s)`);


for (const vault of vaults) {
  const notes = await listNotes(vault);
  console.error(`[${vault.name}] Found ${notes.length} notes`);

  // Print the first 5 notes as a sanity check
  for (const note of notes.slice(0, 5)) {
    console.error(`  - ${note.relativePath}`);
  }

  // Read the first note to verify file access works
  if (notes.length > 0) {
    const content = await readNote(notes[0].path);
    console.error(`\nFirst note preview (${notes[0].name}):`);
    console.error(content.slice(0, 200) + "...");
  }
}


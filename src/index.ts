import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "obsidian-mcp", 
  version: "1.0.0",
});

const transport = new StdioServerTransport()

await server.connect(transport)

console.log("connected to the mcp thing")

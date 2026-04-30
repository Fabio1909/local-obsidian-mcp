import { readdir, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join, relative, extname, basename } from "node:path";

import { NoteInfo, VaultConfig, SearchResult } from "./types.js"

async function walkDir(
  rootPath: string,
  currentPath: string,
  notes: NoteInfo[]
): Promise<void> {

  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = join(currentPath, entry.name);
    const ext = extname(entry.name); // ADD THIS

    if (entry.isDirectory()) {
      await walkDir(rootPath, fullPath, notes);
    } else if (ext === ".md") {
      notes.push({
        name: basename(entry.name, ".md"),
        path: fullPath,
        relativePath: relative(rootPath, fullPath),
      });
    }
  }
}

export async function listNotes(vault: VaultConfig): Promise<NoteInfo[]> {
  const notes: NoteInfo[] = [];
  await walkDir(vault.path, vault.path, notes)
  return notes
}

// simple wrapper function tha reads notes in utf-8
export async function readNote(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

// reads file line-by-line (stream), returns lines containing query (up to maxMatches)
async function contentHasMatch(filePath: string, query: string, maxMatches: number): Promise<string[]> {
  const stream = createReadStream(filePath);
  const rl = createInterface({ input: stream });
  const matches: string[] = [];
  const lowerQuery = query.toLowerCase();

  for await (const line of rl) {
    if (line.toLowerCase().includes(lowerQuery)) {
      matches.push(line);
      if (matches.length >= maxMatches) break;
    }
  }

  stream.destroy(); // close file handle — needed when we break early
  return matches;
}

export async function searchNotes(
  vault: VaultConfig,
  query: string,
  searchContent: boolean,
  maxResults: number
): Promise<SearchResult[]> {
  const notes = await listNotes(vault);
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const note of notes) {
    if (results.length >= maxResults) break;

    if (note.name.toLowerCase().includes(lowerQuery)) {
      // title matched — no need to open the file
      results.push({ note, matches: [] });
    } else if (searchContent) {
      // title didn't match — scan file content only if caller asked for it
      const matches = await contentHasMatch(note.path, query, maxResults);
      if (matches.length > 0) {
        results.push({ note, matches });
      }
    }
  }

  return results;
}

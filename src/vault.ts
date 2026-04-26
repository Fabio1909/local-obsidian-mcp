import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";

import { NoteInfo, VaultConfig } from "./types.js"

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

# Plan: `search_notes` tool

**Goal:** search note titles and/or content by keyword, return matching notes with context.

---

## Step 1 — new type in `types.ts`

Add `SearchResult` interface:
- `note: NoteInfo` — matched note
- `matches: string[]` — matching lines (empty if title-only match)

---

## Step 2 — new function in `vault.ts`

Two functions:

**`contentHasMatch(path, query)`** — stream-based, returns `Promise<string[]>` (matched lines):
- open file with `fs.createReadStream(path)`
- wrap with `readline.createInterface({ input: stream })`
- `for await (const line of rl)` — iterate line by line
- if line contains query (case-insensitive) → push to matches array
- `break` early on first match if only checking existence (or collect all matches)
- never loads full file into memory

**`searchNotes(vault, query, searchContent)`** — main search:
- call `listNotes()` to get all `NoteInfo[]`
- for each note: check `note.name` contains query (cheap, no I/O)
- if `searchContent === true`: call `contentHasMatch()` on notes that didn't match by name
- return `SearchResult[]`

---

## Step 3 — register tool in `index.ts`

Add `search_notes` to `ListToolsRequestSchema` handler:
- `query: string` (required)
- `vault?: string` (optional)
- `searchContent?: boolean` (optional, default `false`)

Add handler branch in `CallToolRequestSchema` — same vault filter pattern as `list_notes`, call `searchNotes()`, format as text.

---

## Unresolved questions

- Return all matching lines per note or cap at N lines? (flood risk on common words)
- Max total results cap?
- Case-sensitive option worth adding?

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { VaultConfig, VaultsFile } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VAULTS_PATH = join(__dirname, "..", "vaults.json");

export async function loadVaults(): Promise<VaultConfig[]> {
  const raw = await readFile(VAULTS_PATH, "utf-8"); 
  const parsed = JSON.parse(raw) as VaultsFile;
  return parsed.vaults;
};

import { readFile } from "node:fs/promises";
import type { VaultConfig, VaultsFile } from "./types.js";

export async function loadVaults(): Promise<VaultConfig[]> {
  const raw = await readFile("vaults.json", "utf-8"); 
  const parsed = JSON.parse(raw) as VaultsFile;
  return parsed.vaults;
};

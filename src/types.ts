// This type is for reading the name path of vaults from our vaults.json
export interface VaultConfig {
  name: string,
  path: string,
};

// This one is for the vaults.json file because that too has a structure
export interface VaultsFile {
  vaults: VaultConfig[], //this means an array of VaultConfig's
}

// this one is for a single note in our vaults
export interface NoteInfo {
  name: string, // this will be the name of the note without the .md at the end 
  path: string, // this will be the ABSOLUTE path of the note 
  relativePath: string, // this will be the relative path wrt the root of the vault
}


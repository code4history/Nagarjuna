export type IMEType = 
  | 'hentaigana' 
  | 'siddham' 
  | 'itaiji' 
  | 'buddha_name';

export interface IMEEntry {
  reading: string;
  char: string;
  type: IMEType;
}

export interface IMEOptions {
  enabledTypes: {
    hentaigana?: boolean;
    siddham?: boolean;
    itaiji?: boolean;
    buddha_name?: boolean;
  };
}

export interface IMESearchResult {
  char: string;
  reading: string;
  type: IMEType;
}

export class IMEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IMEError';
  }
}
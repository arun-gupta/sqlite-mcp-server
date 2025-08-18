export interface DatabaseConfig {
  dbPath: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  createSql?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  defaultValue?: any;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export interface InsertResult {
  lastID: number;
  changes: number;
}

export interface UpdateResult {
  changes: number;
}

export interface DeleteResult {
  changes: number;
}

export interface DatabaseError {
  message: string;
  code?: string;
  errno?: number;
}

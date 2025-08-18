export interface QueryRequest {
  query: string;
}

export interface InsertRequest {
  tableName: string;
  data: Record<string, any>;
}

export interface UpdateRequest {
  tableName: string;
  data: Record<string, any>;
  where: Record<string, any>;
}

export interface DeleteRequest {
  tableName: string;
  where: Record<string, any>;
}

export interface ToolExecuteRequest {
  arguments: Record<string, any>;
}

export interface HTTPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp?: string;
}

export interface ServerInfoResponse {
  name: string;
  version: string;
  capabilities: Record<string, any>;
}

export interface TablesResponse {
  tables: string[];
}

export interface TableSchemaResponse {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    notNull: boolean;
    primaryKey: boolean;
    defaultValue?: any;
  }>;
  createSql?: string;
}

export interface QueryResponse {
  rows: any[];
  rowCount: number;
  query: string;
}

export interface InsertResponse {
  lastID: number;
  changes: number;
  tableName: string;
}

export interface UpdateResponse {
  changes: number;
  tableName: string;
}

export interface DeleteResponse {
  changes: number;
  tableName: string;
}

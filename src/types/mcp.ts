export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPContent {
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  mimeType?: string;
  name?: string;
}

export interface MCPToolCallRequest extends MCPRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface MCPToolListRequest extends MCPRequest {
  method: 'tools/list';
  params: {};
}

export interface MCPToolCallResponse extends MCPResponse {
  result: {
    content: MCPContent[];
    isError?: boolean;
  };
}

export interface MCPToolListResponse extends MCPResponse {
  result: {
    tools: MCPTool[];
  };
}

export interface MCPInitializeRequest extends MCPRequest {
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: {
      tools: Record<string, any>;
    };
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

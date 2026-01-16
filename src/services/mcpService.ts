import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

/**
 * Service to handle Model Context Protocol (MCP) connections
 * This connects COGNIFLOW to BrowserOS MCP server
 */
class MCPService {
  private static instance: MCPService;
  private client: Client | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Initialize connection to BrowserOS MCP server
   */
  public async initialize(): Promise<boolean> {
    try {
      // BrowserOS MCP server URL
      const mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'http://127.0.0.1:9111/mcp';
      
      console.log(`Connecting to MCP server at: ${mcpServerUrl}`);
      
      // Create transport
      const transport = new SSEClientTransport(new URL(mcpServerUrl));

      // Create MCP client
      this.client = new Client({
        name: "COGNIFLOW",
        version: "0.2.2"
      }, {
        capabilities: {}
      });

      // Connect to transport
      await this.client.connect(transport);
      this.isConnected = true;
      
      console.log('Successfully connected to BrowserOS MCP server');
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test if MCP connection is working
   */
  public async ping(): Promise<void> {
    if (this.client) {
      await this.client.ping();
    }
  }

  /**
   * Get available tools from MCP server
   */
  public async getAvailableTools() {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not initialized or not connected');
    }

    try {
      // Get tools from MCP server
      const tools = await this.client.listTools();
      return tools;
    } catch (error) {
      console.error('Error getting tools from MCP server:', error);
      throw error;
    }
  }

  /**
   * Call a specific tool on the MCP server
   */
  public async callTool(toolName: string, parameters: Record<string, any>) {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not initialized or not connected');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: parameters
      });
      return result;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Check if MCP service is connected
   */
  public isConnectedToMCP(): boolean {
    return this.isConnected;
  }

  /**
   * Get MCP client instance
   */
  public getClient() {
    return this.client;
  }
}

export const mcpService = MCPService.getInstance();
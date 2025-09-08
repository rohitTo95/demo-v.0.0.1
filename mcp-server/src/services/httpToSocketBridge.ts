import { io, Socket } from 'socket.io-client';
import { CurrentPageData, ClickableElement } from '../utils/socketManager';

/**
 * HTTP-to-Socket.IO Bridge Service
 * 
 * This service creates a dedicated Socket.IO client that connects to our own MCP server
 * and acts as a bridge between HTTP requests (from AI agents) and Socket.IO MCP connections.
 * 
 * Architecture:
 * HTTP AI Agent → HTTP Bridge → Socket.IO MCP Client → MCP Server → Next.js App
 */
export class HttpToSocketBridge {
  private mcpClient: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(private serverUrl: string = 'http://localhost:3001') {
    this.initializeConnection();
  }

  /**
   * Initialize Socket.IO connection to MCP server
   */
  private initializeConnection(): void {
    console.log('🌉 HTTP Bridge: Initializing Socket.IO connection to MCP server...');
    
    this.mcpClient = io(`${this.serverUrl}/tools`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.mcpClient) return;

    this.mcpClient.on('connect', () => {
      console.log('🌉 HTTP Bridge: Connected to MCP server with ID:', this.mcpClient?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.mcpClient.on('disconnect', () => {
      console.log('🌉 HTTP Bridge: Disconnected from MCP server');
      this.isConnected = false;
    });

    this.mcpClient.on('connect_error', (error) => {
      console.error('🌉 HTTP Bridge: Connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🌉 HTTP Bridge: Max reconnection attempts reached');
      }
    });

    // Handle MCP responses
    this.mcpClient.on('currentPageData', (data: CurrentPageData) => {
      console.log('🌉 HTTP Bridge: Received currentPageData:', data);
    });

    this.mcpClient.on('clickableElementsData', (data: ClickableElement[]) => {
      console.log('🌉 HTTP Bridge: Received clickableElementsData:', data?.length, 'elements');
    });

    this.mcpClient.on('clickElementSuccess', (data: CurrentPageData) => {
      console.log('🌉 HTTP Bridge: Received clickElementSuccess:', data);
    });

    this.mcpClient.on('navigatePageSuccess', (data: CurrentPageData) => {
      console.log('🌉 HTTP Bridge: Received navigatePageSuccess:', data);
    });

    this.mcpClient.on('error', (error) => {
      console.error('🌉 HTTP Bridge: MCP Error:', error);
    });
  }

  /**
   * Check if bridge is ready to handle requests
   */
  public isReady(): boolean {
    return this.isConnected && this.mcpClient !== null;
  }

  /**
   * HTTP Bridge Method: Get Current Page
   */
  public async getCurrentPage(): Promise<CurrentPageData | null> {
    if (!this.isReady()) {
      console.error('🌉 HTTP Bridge: Not connected to MCP server');
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('🌉 HTTP Bridge: getCurrentPage timeout');
        resolve(null);
      }, 5000);

      // Set up one-time response listener
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('🌉 HTTP Bridge: getCurrentPage response received:', data);
        this.mcpClient?.off('currentPageData', responseHandler);
        resolve(data);
      };

      this.mcpClient?.on('currentPageData', responseHandler);

      // Send MCP request
      console.log('🌉 HTTP Bridge: Sending getCurrentPage request via Socket.IO');
      this.mcpClient?.emit('getCurrentPage');
    });
  }

  /**
   * HTTP Bridge Method: Get Clickable Elements
   */
  public async getClickableElements(): Promise<ClickableElement[] | null> {
    if (!this.isReady()) {
      console.error('🌉 HTTP Bridge: Not connected to MCP server');
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('🌉 HTTP Bridge: getClickableElements timeout');
        resolve(null);
      }, 5000);

      // Set up one-time response listener
      const responseHandler = (data: ClickableElement[]) => {
        clearTimeout(timeout);
        console.log('🌉 HTTP Bridge: getClickableElements response received:', data?.length, 'elements');
        this.mcpClient?.off('clickableElementsData', responseHandler);
        resolve(data);
      };

      this.mcpClient?.on('clickableElementsData', responseHandler);

      // Send MCP request
      console.log('🌉 HTTP Bridge: Sending getClickableElements request via Socket.IO');
      this.mcpClient?.emit('getClickableElements');
    });
  }

  /**
   * HTTP Bridge Method: Click Element
   */
  public async clickElement(elementName: string): Promise<CurrentPageData | null> {
    if (!this.isReady()) {
      console.error('🌉 HTTP Bridge: Not connected to MCP server');
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('🌉 HTTP Bridge: clickElement timeout for:', elementName);
        resolve(null);
      }, 5000);

      // Set up one-time response listener
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('🌉 HTTP Bridge: clickElement response received:', data);
        this.mcpClient?.off('clickElementSuccess', responseHandler);
        resolve(data);
      };

      this.mcpClient?.on('clickElementSuccess', responseHandler);

      // Send MCP request
      console.log('🌉 HTTP Bridge: Sending clickElement request via Socket.IO:', elementName);
      this.mcpClient?.emit('clickElement', { name: elementName });
    });
  }

  /**
   * HTTP Bridge Method: Navigate Page
   */
  public async navigatePage(page: string): Promise<CurrentPageData | null> {
    if (!this.isReady()) {
      console.error('🌉 HTTP Bridge: Not connected to MCP server');
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('🌉 HTTP Bridge: navigatePage timeout for:', page);
        resolve(null);
      }, 5000);

      // Set up one-time response listener
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('🌉 HTTP Bridge: navigatePage response received:', data);
        this.mcpClient?.off('navigatePageSuccess', responseHandler);
        resolve(data);
      };

      this.mcpClient?.on('navigatePageSuccess', responseHandler);

      // Send MCP request
      console.log('🌉 HTTP Bridge: Sending navigatePage request via Socket.IO:', page);
      this.mcpClient?.emit('navigatePage', page);
    });
  }

  /**
   * Get bridge connection status
   */
  public getStatus(): { connected: boolean; clientId: string | null; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      clientId: this.mcpClient?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Cleanup bridge connection
   */
  public disconnect(): void {
    if (this.mcpClient) {
      console.log('🌉 HTTP Bridge: Disconnecting from MCP server');
      this.mcpClient.disconnect();
      this.mcpClient = null;
      this.isConnected = false;
    }
  }
}

// Singleton instance
let httpBridge: HttpToSocketBridge | null = null;

export const getHttpBridge = (): HttpToSocketBridge => {
  if (!httpBridge) {
    httpBridge = new HttpToSocketBridge();
  }
  return httpBridge;
};

export const initializeHttpBridge = (serverUrl?: string): HttpToSocketBridge => {
  if (!httpBridge) {
    httpBridge = new HttpToSocketBridge(serverUrl);
  }
  return httpBridge;
};

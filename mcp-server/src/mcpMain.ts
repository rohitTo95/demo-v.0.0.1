#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { 
  PageInfo, 
  ClickableElement, 
  ClickResult, 
  NavigationResult, 
  BookingFormResult 
} from './types/mcp.js';

class SimpleMCPServer {
  private server: Server;
  private httpServer?: any;
  private io?: SocketIOServer;
  private nextjsClients: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'hotel-booking-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools(): void {
    const tools: Tool[] = [
      {
        name: 'getCurrentPage',
        description: 'Get current page information',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Optional session ID to target specific client'
            }
          },
          required: []
        }
      },
      {
        name: 'getClickableElements',
        description: 'Get clickable elements on current page',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Optional session ID to target specific client'
            }
          },
          required: []
        }
      },
      {
        name: 'clickElement',
        description: 'Click a named element',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Element name to click'
            },
            sessionId: {
              type: 'string',
              description: 'Optional session ID to target specific client'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'navigatePage',
        description: 'Navigate to a page',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              description: 'Page path to navigate to'
            },
            sessionId: {
              type: 'string',
              description: 'Optional session ID to target specific client'
            }
          },
          required: ['page']
        }
      },
      {
        name: 'fillBookingForm',
        description: 'Fill booking form',
        inputSchema: {
          type: 'object',
          properties: {
            checkIn: { type: 'string' },
            checkOut: { type: 'string' },
            guests: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            sessionId: {
              type: 'string',
              description: 'Optional session ID to target specific client'
            }
          },
          required: []
        }
      }
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Get sessionId from args, or use the first available connected client
      let sessionId = (args as any)?.sessionId;
      if (!sessionId || !this.nextjsClients.has(sessionId)) {
        // Use the first available connected client
        const availableClients = Array.from(this.nextjsClients.keys());
        console.log(`Available Next.js clients: [${availableClients.join(', ')}]`);
        
        if (availableClients.length === 0) {
          throw new Error('No Next.js clients connected');
        }
        sessionId = availableClients[0];
        console.log(`Using first available client as sessionId: ${sessionId}`);
      } else {
        console.log(`Using specified sessionId: ${sessionId}`);
      }

      try {
        let result: any;

        switch (name) {
          case 'getCurrentPage':
            result = await this.getCurrentPage(sessionId);
            break;
          case 'getClickableElements':
            result = await this.getClickableElements(sessionId);
            break;
          case 'clickElement':
            result = await this.clickElement(sessionId, (args as any).name);
            break;
          case 'navigatePage':
            result = await this.navigatePage(sessionId, (args as any).page);
            break;
          case 'fillBookingForm':
            result = await this.fillBookingForm(sessionId, args as any);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error',
                tool: name,
                sessionId,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async getCurrentPage(sessionId: string): Promise<PageInfo> {
    console.log(`🔍 [getCurrentPage] Starting for sessionId: ${sessionId}`);
    
    return new Promise((resolve, reject) => {
      const socket = this.nextjsClients.get(sessionId);
      if (!socket) {
        console.log(`❌ [getCurrentPage] No Next.js client found for sessionId: ${sessionId}`);
        console.log(`❌ [getCurrentPage] Available clients:`, Array.from(this.nextjsClients.keys()));
        reject(new Error('No Next.js client connected'));
        return;
      }

      console.log(`✅ [getCurrentPage] Found client for sessionId: ${sessionId}`);
      console.log(`📤 [getCurrentPage] Emitting 'mcp:getCurrentPage' to client`);

      const timeout = setTimeout(() => {
        console.log(`⏰ [getCurrentPage] Timeout after 5 seconds for sessionId: ${sessionId}`);
        reject(new Error('Timeout'));
      }, 5000);

      const handler = (pageInfo: PageInfo) => {
        console.log(`📥 [getCurrentPage] Received response from client:`, pageInfo);
        clearTimeout(timeout);
        socket.off('mcp:pageInfo', handler);
        resolve(pageInfo);
      };

      socket.on('mcp:pageInfo', handler);
      socket.emit('mcp:getCurrentPage');
    });
  }

  private async getClickableElements(sessionId: string): Promise<ClickableElement[]> {
    console.log(`🔍 [getClickableElements] Starting for sessionId: ${sessionId}`);
    
    return new Promise((resolve, reject) => {
      const socket = this.nextjsClients.get(sessionId);
      if (!socket) {
        console.log(`❌ [getClickableElements] No Next.js client found for sessionId: ${sessionId}`);
        console.log(`❌ [getClickableElements] Available clients:`, Array.from(this.nextjsClients.keys()));
        reject(new Error('No Next.js client connected'));
        return;
      }

      console.log(`✅ [getClickableElements] Found client for sessionId: ${sessionId}`);
      console.log(`📤 [getClickableElements] Emitting 'mcp:getClickableElements' to client`);

      const timeout = setTimeout(() => {
        console.log(`⏰ [getClickableElements] Timeout after 5 seconds for sessionId: ${sessionId}`);
        reject(new Error('Timeout'));
      }, 5000);

      const handler = (elements: ClickableElement[]) => {
        console.log(`📥 [getClickableElements] Received response from client:`, elements);
        console.log(`📊 [getClickableElements] Received ${elements?.length || 0} elements`);
        clearTimeout(timeout);
        socket.off('mcp:clickableElements', handler);
        resolve(elements);
      };

      socket.on('mcp:clickableElements', handler);
      socket.emit('mcp:getClickableElements');
    });
  }

  private async clickElement(sessionId: string, elementName: string): Promise<ClickResult> {
    console.log(`🖱️ [clickElement] Starting for sessionId: ${sessionId}, element: ${elementName}`);
    
    return new Promise((resolve, reject) => {
      const socket = this.nextjsClients.get(sessionId);
      if (!socket) {
        console.log(`❌ [clickElement] No Next.js client found for sessionId: ${sessionId}`);
        console.log(`❌ [clickElement] Available clients:`, Array.from(this.nextjsClients.keys()));
        reject(new Error('No Next.js client connected'));
        return;
      }

      console.log(`✅ [clickElement] Found client for sessionId: ${sessionId}`);
      console.log(`📤 [clickElement] Emitting 'mcp:clickElement' to client with elementName: ${elementName}`);

      const timeout = setTimeout(() => {
        console.log(`⏰ [clickElement] Timeout after 10 seconds for sessionId: ${sessionId}, element: ${elementName}`);
        reject(new Error('Timeout'));
      }, 10000);

      const handler = (result: ClickResult) => {
        console.log(`📥 [clickElement] Received response from client:`, result);
        clearTimeout(timeout);
        socket.off('mcp:clickResult', handler);
        resolve(result);
      };

      socket.on('mcp:clickResult', handler);
      socket.emit('mcp:clickElement', elementName);
    });
  }

  private async navigatePage(sessionId: string, page: string): Promise<NavigationResult> {
    console.log(`🧭 [navigatePage] Starting for sessionId: ${sessionId}, page: ${page}`);
    
    return new Promise((resolve, reject) => {
      const socket = this.nextjsClients.get(sessionId);
      if (!socket) {
        console.log(`❌ [navigatePage] No Next.js client found for sessionId: ${sessionId}`);
        console.log(`❌ [navigatePage] Available clients:`, Array.from(this.nextjsClients.keys()));
        reject(new Error('No Next.js client connected'));
        return;
      }

      console.log(`✅ [navigatePage] Found client for sessionId: ${sessionId}`);
      console.log(`📤 [navigatePage] Emitting 'mcp:navigatePage' to client with page: ${page}`);

      const timeout = setTimeout(() => {
        console.log(`⏰ [navigatePage] Timeout after 10 seconds for sessionId: ${sessionId}, page: ${page}`);
        reject(new Error('Timeout'));
      }, 10000);

      const handler = (result: NavigationResult) => {
        console.log(`📥 [navigatePage] Received response from client:`, result);
        clearTimeout(timeout);
        socket.off('mcp:navigationResult', handler);
        resolve(result);
      };

      socket.on('mcp:navigationResult', handler);
      socket.emit('mcp:navigatePage', page);
    });
  }

  private async fillBookingForm(sessionId: string, formData: any): Promise<BookingFormResult> {
    console.log(`📝 [fillBookingForm] Starting for sessionId: ${sessionId}, formData:`, formData);
    
    return new Promise((resolve, reject) => {
      const socket = this.nextjsClients.get(sessionId);
      if (!socket) {
        console.log(`❌ [fillBookingForm] No Next.js client found for sessionId: ${sessionId}`);
        console.log(`❌ [fillBookingForm] Available clients:`, Array.from(this.nextjsClients.keys()));
        reject(new Error('No Next.js client connected'));
        return;
      }

      console.log(`✅ [fillBookingForm] Found client for sessionId: ${sessionId}`);
      console.log(`📤 [fillBookingForm] Emitting 'mcp:fillBookingForm' to client with formData:`, formData);

      const timeout = setTimeout(() => {
        console.log(`⏰ [fillBookingForm] Timeout after 15 seconds for sessionId: ${sessionId}`);
        reject(new Error('Timeout'));
      }, 15000);

      const handler = (result: BookingFormResult) => {
        console.log(`📥 [fillBookingForm] Received response from client:`, result);
        clearTimeout(timeout);
        socket.off('mcp:bookingFormResult', handler);
        resolve(result);
      };

      socket.on('mcp:bookingFormResult', handler);
      socket.emit('mcp:fillBookingForm', formData);
    });
  }

  async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async startHttp(port: number = 3001): Promise<void> {
    this.httpServer = createServer();
    this.io = new SocketIOServer(this.httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // Handle main namespace connections
    this.io.on('connection', (socket) => {
      console.log(`🔌 [MAIN] Client connected to main namespace: ${socket.id}`);
      console.log(`🔌 [MAIN] Total clients connected: ${this.nextjsClients.size}`);
      
      socket.on('register:nextjs', () => {
        console.log(`✅ [MAIN] Next.js client registered: ${socket.id}`);
        this.nextjsClients.set(socket.id, socket);
        console.log(`✅ [MAIN] Updated client list:`, Array.from(this.nextjsClients.keys()));
      });

      socket.on('disconnect', () => {
        console.log(`❌ [MAIN] Client disconnected from main namespace: ${socket.id}`);
        this.nextjsClients.delete(socket.id);
        
        console.log(`❌ [MAIN] Remaining clients:`, Array.from(this.nextjsClients.keys()));
      });
    });

    // Handle /tools namespace connections (for Next.js MCP client)
    const toolsNamespace = this.io.of('/tools');
    toolsNamespace.on('connection', (socket) => {
      console.log(`🔌 [TOOLS] Client connected to tools namespace: ${socket.id}`);
      console.log(`🔌 [TOOLS] Total clients connected: ${this.nextjsClients.size}`);
      
      // Auto-register Next.js clients in the tools namespace
      this.nextjsClients.set(socket.id, socket);
      console.log(`✅ [TOOLS] Auto-registered Next.js client: ${socket.id}`);
      console.log(`✅ [TOOLS] Updated client list:`, Array.from(this.nextjsClients.keys()));
      
      socket.on('register:nextjs', () => {
        console.log(`✅ [TOOLS] Next.js client explicitly registered: ${socket.id}`);
        this.nextjsClients.set(socket.id, socket);
        console.log(`✅ [TOOLS] Updated client list:`, Array.from(this.nextjsClients.keys()));
      });

      socket.on('disconnect', () => {
        console.log(`❌ [TOOLS] Client disconnected from tools namespace: ${socket.id}`);
        this.nextjsClients.delete(socket.id);
        console.log(`❌ [TOOLS] Remaining clients:`, Array.from(this.nextjsClients.keys()));
      });
    });

    this.httpServer.listen(port, () => {
      console.log(`MCP Server running on port ${port}`);
      console.log(`Socket.IO listening on http://localhost:${port}`);
      console.log(`Tools namespace available at http://localhost:${port}/tools`);
    });
  }

  async start(): Promise<void> {
    const mode = process.argv[2] || 'stdio';
    
    if (mode === 'http') {
      await this.startHttp();
    } else if (mode === 'both') {
      await this.startHttp();
      await this.startStdio();
    } else {
      await this.startStdio();
    }
  }
}

// Start server
const server = new SimpleMCPServer();
server.start().catch(console.error);

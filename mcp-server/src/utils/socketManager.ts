import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

// Hotel booking data interface
export interface BookingData {
  room_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  special_requests?: string;
}

// Completed booking data interface
export interface CompletedBookingData extends BookingData {
  total_price: number;
  booking_id: string;
  completedAt: string;
}

// MCP Tool interfaces
export interface ClickableElement {
  name: string;
  description: string;
  selector?: string;
  type?: string;
  isVisible?: boolean;
}

export interface CurrentPageData {
  currentPage: string;
  title?: string;
  url?: string;
}

export interface ClickElementRequest {
  name: string;
}

export interface NavigatePageRequest {
  page: string;
}

export interface MCPError {
  error: string;
  message: string;
  timestamp: string;
}

// Client session tracking
export interface ClientSession {
  id: string;
  currentPage: string;
  lastActivity: Date;
  isNextJsClient: boolean;
}

export interface SocketEvents {
  'booking:fill': BookingData;
  'booking:completed': CompletedBookingData;
  'form:received': { timestamp: string; data: any };
  'form:processing': { timestamp: string; message: string };
  'form:submitted': { timestamp: string; success: boolean; response?: any };
  'form:error': { timestamp: string; error: string };
  'tool:status': { tool: string; status: string; data?: any };
  
  // MCP Tool Events
  'getCurrentPage': void;
  'currentPageData': CurrentPageData;
  'getClickableElements': void;
  'clickableElementsData': ClickableElement[];
  'clickElement': ClickElementRequest;
  'clickElementSuccess': CurrentPageData;
  'navigatePage': string;
  'navigatePageSuccess': CurrentPageData;
  'error': MCPError;
}

export class SocketManager {
  private io: Server;
  private toolsNamespace: any;
  private clientSessions: Map<string, ClientSession> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Create /tools namespace as required by MCP documentation
    this.toolsNamespace = this.io.of('/tools');
    this.setupEventHandlers();
    this.startSessionCleanup();
  }

  private setupEventHandlers(): void {
    // Main namespace connection
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      // Initialize session
      this.clientSessions.set(socket.id, {
        id: socket.id,
        currentPage: '/',
        lastActivity: new Date(),
        isNextJsClient: false
      });

      // MCP Tool 1: Get Current Page
      socket.on('getCurrentPage', () => {
        console.log(`📍 getCurrentPage request from ${socket.id}`);
        this.updateClientActivity(socket.id);
        
        // Find Next.js client session
        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          // Forward request to Next.js client
          this.io.to(nextJsSession.id).emit('getCurrentPage');
        } else {
          this.emitError(socket.id, 'No Next.js client connected', 'NEXTJS_CLIENT_NOT_FOUND');
        }
      });

      // MCP Tool 2: Click Element
      socket.on('clickElement', (data: ClickElementRequest) => {
        console.log(`🖱️ clickElement request from ${socket.id}:`, data);
        this.updateClientActivity(socket.id);
        
        if (!data.name) {
          this.emitError(socket.id, 'Element name is required', 'INVALID_ELEMENT_NAME');
          return;
        }

        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          // Forward request to Next.js client
          this.io.to(nextJsSession.id).emit('clickElement', data);
        } else {
          this.emitError(socket.id, 'No Next.js client connected', 'NEXTJS_CLIENT_NOT_FOUND');
        }
      });

      // MCP Tool 3: Get Clickable Elements
      socket.on('getClickableElements', () => {
        console.log(`🔍 getClickableElements request from ${socket.id}`);
        this.updateClientActivity(socket.id);
        
        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          // Forward request to Next.js client
          this.io.to(nextJsSession.id).emit('getClickableElements');
        } else {
          this.emitError(socket.id, 'No Next.js client connected', 'NEXTJS_CLIENT_NOT_FOUND');
        }
      });

      // MCP Tool 4: Navigate Page
      socket.on('navigatePage', (page: string) => {
        console.log(`🧭 navigatePage request from ${socket.id}:`, page);
        this.updateClientActivity(socket.id);
        
        if (!page || typeof page !== 'string') {
          this.emitError(socket.id, 'Valid page path is required', 'INVALID_PAGE_PATH');
          return;
        }

        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          // Forward request to Next.js client
          this.io.to(nextJsSession.id).emit('navigatePage', page);
        } else {
          this.emitError(socket.id, 'No Next.js client connected', 'NEXTJS_CLIENT_NOT_FOUND');
        }
      });

      // Handle responses from Next.js client
      socket.on('currentPageData', (data: CurrentPageData) => {
        console.log(`📍 currentPageData response from ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        // Broadcast to all MCP clients
        socket.broadcast.emit('currentPageData', data);
      });

      socket.on('clickableElementsData', (data: ClickableElement[]) => {
        console.log(`🔍 clickableElementsData response from ${socket.id}:`, data?.length, 'elements');
        this.updateClientActivity(socket.id);
        // Broadcast to all MCP clients
        socket.broadcast.emit('clickableElementsData', data);
      });

      socket.on('clickElementSuccess', (data: CurrentPageData) => {
        console.log(`🖱️ clickElementSuccess response from ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        // Broadcast to all MCP clients
        socket.broadcast.emit('clickElementSuccess', data);
      });

      socket.on('navigatePageSuccess', (data: CurrentPageData) => {
        console.log(`🧭 navigatePageSuccess response from ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        // Broadcast to all MCP clients
        socket.broadcast.emit('navigatePageSuccess', data);
      });

      // Handle Next.js client registration
      socket.on('register:nextjs', () => {
        console.log(`🎯 Next.js client registered: ${socket.id}`);
        this.updateClientSession(socket.id, '/', true);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        this.clientSessions.delete(socket.id);
      });

      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`🏠 Client ${socket.id} joined room: ${room}`);
      });

      socket.on('leave-room', (room: string) => {
        socket.leave(room);
        console.log(`🚪 Client ${socket.id} left room: ${room}`);
      });
    });

    // Tools namespace connection (required for MCP)
    this.toolsNamespace.on('connection', (socket: any) => {
      console.log('🔧 Client connected to /tools namespace:', socket.id);
      
      // Initialize session for /tools namespace
      this.clientSessions.set(socket.id, {
        id: socket.id,
        currentPage: '/',
        lastActivity: new Date(),
        isNextJsClient: false
      });

      // Handle Next.js client registration for /tools namespace
      socket.on('register:nextjs', () => {
        console.log(`🎯 Next.js client registered in /tools namespace: ${socket.id}`);
        this.updateClientSession(socket.id, '/', true);
      });

      // MCP Tool events in /tools namespace
      socket.on('getCurrentPage', () => {
        console.log(`📍 getCurrentPage request from /tools namespace ${socket.id}`);
        this.updateClientActivity(socket.id);
        
        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          this.toolsNamespace.to(nextJsSession.id).emit('getCurrentPage');
        } else {
          socket.emit('error', {
            error: 'NEXTJS_CLIENT_NOT_FOUND',
            message: 'No Next.js client connected',
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('clickElement', (data: ClickElementRequest) => {
        console.log(`🖱️ clickElement request from /tools namespace ${socket.id}:`, data);
        this.updateClientActivity(socket.id);
        
        if (!data.name) {
          socket.emit('error', {
            error: 'INVALID_ELEMENT_NAME',
            message: 'Element name is required',
            timestamp: new Date().toISOString()
          });
          return;
        }

        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          this.toolsNamespace.to(nextJsSession.id).emit('clickElement', data);
        } else {
          socket.emit('error', {
            error: 'NEXTJS_CLIENT_NOT_FOUND',
            message: 'No Next.js client connected',
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('getClickableElements', () => {
        console.log(`🔍 getClickableElements request from /tools namespace ${socket.id}`);
        this.updateClientActivity(socket.id);
        
        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          this.toolsNamespace.to(nextJsSession.id).emit('getClickableElements');
        } else {
          socket.emit('error', {
            error: 'NEXTJS_CLIENT_NOT_FOUND',
            message: 'No Next.js client connected',
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('navigatePage', (page: string) => {
        console.log(`🧭 navigatePage request from /tools namespace ${socket.id}:`, page);
        this.updateClientActivity(socket.id);
        
        if (!page || typeof page !== 'string') {
          socket.emit('error', {
            error: 'INVALID_PAGE_PATH',
            message: 'Valid page path is required',
            timestamp: new Date().toISOString()
          });
          return;
        }

        const nextJsSession = this.findNextJsClient();
        if (nextJsSession) {
          this.toolsNamespace.to(nextJsSession.id).emit('navigatePage', page);
        } else {
          socket.emit('error', {
            error: 'NEXTJS_CLIENT_NOT_FOUND',
            message: 'No Next.js client connected',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle responses from Next.js client in /tools namespace
      socket.on('currentPageData', (data: CurrentPageData) => {
        console.log(`📍 currentPageData response from /tools namespace ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        
        // Broadcast to other MCP clients
        socket.broadcast.emit('currentPageData', data);
      });

      socket.on('clickableElementsData', (data: ClickableElement[]) => {
        console.log(`🔍 clickableElementsData response from /tools namespace ${socket.id}:`, data?.length, 'elements');
        this.updateClientActivity(socket.id);
        
        // Broadcast to other MCP clients
        socket.broadcast.emit('clickableElementsData', data);
      });

      socket.on('clickElementSuccess', (data: CurrentPageData) => {
        console.log(`🖱️ clickElementSuccess response from /tools namespace ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        
        // Broadcast to other MCP clients
        socket.broadcast.emit('clickElementSuccess', data);
      });

      socket.on('navigatePageSuccess', (data: CurrentPageData) => {
        console.log(`🧭 navigatePageSuccess response from /tools namespace ${socket.id}:`, data);
        this.updateClientSession(socket.id, data.currentPage, true);
        
        // Broadcast to other MCP clients
        socket.broadcast.emit('navigatePageSuccess', data);
      });
      
      // Listen for booking completion events from Next.js
      socket.on('booking:completed', (data: CompletedBookingData) => {
        console.log('✅ Received booking completion:', data);
        // Forward to other MCP clients if needed
        socket.broadcast.emit('booking:completed', data);
      });
      
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected from /tools namespace:', socket.id);
        this.clientSessions.delete(socket.id);
      });
    });
  }

  // Session management methods
  private updateClientActivity(socketId: string): void {
    const session = this.clientSessions.get(socketId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  private updateClientSession(socketId: string, currentPage: string, isNextJsClient: boolean): void {
    const session = this.clientSessions.get(socketId);
    if (session) {
      session.currentPage = currentPage;
      session.lastActivity = new Date();
      session.isNextJsClient = isNextJsClient;
    }
  }

  private findNextJsClient(): ClientSession | undefined {
    for (const session of this.clientSessions.values()) {
      if (session.isNextJsClient) {
        console.log(`🎯 Found Next.js client session: ${session.id} on page: ${session.currentPage}`);
        return session;
      }
    }
    console.log(`❌ No Next.js client found. Total sessions: ${this.clientSessions.size}`);
    // Debug: log all sessions
    for (const [id, session] of this.clientSessions.entries()) {
      console.log(`   Session ${id}: isNextJsClient=${session.isNextJsClient}, page=${session.currentPage}`);
    }
    return undefined;
  }

  private emitError(socketId: string, message: string, code: string): void {
    this.io.to(socketId).emit('error', {
      error: code,
      message,
      timestamp: new Date().toISOString()
    });
  }

  private startSessionCleanup(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      for (const [socketId, session] of this.clientSessions.entries()) {
        if (session.lastActivity < fiveMinutesAgo) {
          console.log(`🧹 Cleaning up inactive session: ${socketId}`);
          this.clientSessions.delete(socketId);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Emit to all connected clients
  public broadcast<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]): void {
    this.io.emit(event, data);
  }

  // Emit to all clients in tools namespace
  public broadcastToTools<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]): void {
    this.toolsNamespace.emit(event, data);
  }

  // Emit booking fill event to tools namespace (MCP → Next.js)
  public emitBookingFill(bookingData: BookingData): void {
    console.log('Emitting booking:fill event:', bookingData);
    this.toolsNamespace.emit('booking:fill', bookingData);
  }

  // Emit to specific room
  public emitToRoom<K extends keyof SocketEvents>(room: string, event: K, data: SocketEvents[K]): void {
    this.io.to(room).emit(event, data);
  }

  // Emit to specific socket
  public emitToSocket<K extends keyof SocketEvents>(socketId: string, event: K, data: SocketEvents[K]): void {
    this.io.to(socketId).emit(event, data);
  }

  // Get connected clients count
  public getConnectedClientsCount(): Promise<number> {
    return new Promise((resolve) => {
      this.io.engine.clientsCount ? resolve(this.io.engine.clientsCount) : resolve(0);
    });
  }

  // Get session information
  public getSessionInfo(): { total: number; nextJsClients: number; activeSessions: ClientSession[] } {
    const sessions = Array.from(this.clientSessions.values());
    return {
      total: sessions.length,
      nextJsClients: sessions.filter(s => s.isNextJsClient).length,
      activeSessions: sessions
    };
  }

  // Helper method to emit to Next.js client regardless of which namespace they're on
  private emitToNextJsClient(event: string, data?: any): boolean {
    const nextJsSession = this.findNextJsClient();
    if (!nextJsSession) {
      return false;
    }

    // Try to emit to both main namespace and tools namespace
    // The client will be on one of them
    this.io.to(nextJsSession.id).emit(event, data);
    this.toolsNamespace.to(nextJsSession.id).emit(event, data);
    
    console.log(`📤 Emitted '${event}' to Next.js client ${nextJsSession.id} on both namespaces`);
    return true;
  }

  // =============================================================================
  // HTTP-to-Socket.IO Bridge Methods (for AI Agents)
  // 
  // HYBRID ARCHITECTURE:
  // 1. MCP Tools ↔ MCP Server: Socket.IO (existing, working)
  // 2. Next.js App ↔ MCP Server: Socket.IO (existing, working) 
  // 3. AI Agents ↔ MCP Server: HTTP REST API (bridges to Socket.IO)
  //
  // These methods provide HTTP endpoints that bridge to the existing Socket.IO 
  // MCP connections, allowing AI agents to use HTTP while preserving the 
  // working Socket.IO communication with Next.js and other MCP tools.
  // =============================================================================

  /**
   * HTTP API: Get current page information via WebSocket
   * Bridges HTTP requests to Socket.IO MCP connections
   */
  public async getCurrentPageViaWebSocket(): Promise<CurrentPageData | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ getCurrentPageViaWebSocket timeout');
        resolve(null);
      }, 5000);

      // Find Next.js client
      const nextJsSession = this.findNextJsClient();
      if (!nextJsSession) {
        clearTimeout(timeout);
        console.log('❌ No Next.js client found for getCurrentPageViaWebSocket');
        resolve(null);
        return;
      }

      // Set up response listeners on both namespaces
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('✅ HTTP Bridge: getCurrentPageViaWebSocket response received:', data);
        resolve(data);
      };

      // Listen on both main namespace and tools namespace
      this.io.once('currentPageData', responseHandler);
      this.toolsNamespace.once('currentPageData', responseHandler);

      // Send request to Next.js client via both namespaces
      console.log('🌉 HTTP Bridge: Sending getCurrentPage request to Next.js client');
      this.io.to(nextJsSession.id).emit('getCurrentPage');
      this.toolsNamespace.to(nextJsSession.id).emit('getCurrentPage');
    });
  }

  /**
   * HTTP API: Get clickable elements via WebSocket
   * Bridges HTTP requests to Socket.IO MCP connections
   */
  public async getClickableElementsViaWebSocket(): Promise<ClickableElement[] | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ getClickableElementsViaWebSocket timeout');
        resolve(null);
      }, 5000);

      // Find Next.js client
      const nextJsSession = this.findNextJsClient();
      if (!nextJsSession) {
        clearTimeout(timeout);
        console.log('❌ No Next.js client found for getClickableElementsViaWebSocket');
        resolve(null);
        return;
      }

      // Set up response listeners on both namespaces
      const responseHandler = (data: ClickableElement[]) => {
        clearTimeout(timeout);
        console.log('✅ HTTP Bridge: getClickableElementsViaWebSocket response received:', data?.length, 'elements');
        resolve(data);
      };

      // Listen on both main namespace and tools namespace
      this.io.once('clickableElementsData', responseHandler);
      this.toolsNamespace.once('clickableElementsData', responseHandler);

      // Send request to Next.js client via both namespaces
      console.log('🌉 HTTP Bridge: Sending getClickableElements request to Next.js client');
      this.io.to(nextJsSession.id).emit('getClickableElements');
      this.toolsNamespace.to(nextJsSession.id).emit('getClickableElements');
    });
  }

  /**
   * HTTP API: Click element via WebSocket
   * Bridges HTTP requests to Socket.IO MCP connections
   */
  public async clickElementViaWebSocket(elementName: string): Promise<CurrentPageData | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ clickElementViaWebSocket timeout for element:', elementName);
        resolve(null);
      }, 5000);

      // Find Next.js client
      const nextJsSession = this.findNextJsClient();
      if (!nextJsSession) {
        clearTimeout(timeout);
        console.log('❌ No Next.js client found for clickElementViaWebSocket');
        resolve(null);
        return;
      }

      // Set up response listeners on both namespaces
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('✅ HTTP Bridge: clickElementViaWebSocket response received:', data);
        resolve(data);
      };

      // Listen on both main namespace and tools namespace
      this.io.once('clickElementSuccess', responseHandler);
      this.toolsNamespace.once('clickElementSuccess', responseHandler);

      // Send request to Next.js client via both namespaces
      console.log('🌉 HTTP Bridge: Sending clickElement request to Next.js client:', elementName);
      this.io.to(nextJsSession.id).emit('clickElement', { name: elementName });
      this.toolsNamespace.to(nextJsSession.id).emit('clickElement', { name: elementName });
    });
  }

  /**
   * HTTP API: Navigate page via WebSocket
   * Bridges HTTP requests to Socket.IO MCP connections
   */
  public async navigatePageViaWebSocket(page: string): Promise<CurrentPageData | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ navigatePageViaWebSocket timeout for page:', page);
        resolve(null);
      }, 5000);

      // Find Next.js client
      const nextJsSession = this.findNextJsClient();
      if (!nextJsSession) {
        clearTimeout(timeout);
        console.log('❌ No Next.js client found for navigatePageViaWebSocket');
        resolve(null);
        return;
      }

      // Set up response listeners on both namespaces
      const responseHandler = (data: CurrentPageData) => {
        clearTimeout(timeout);
        console.log('✅ HTTP Bridge: navigatePageViaWebSocket response received:', data);
        resolve(data);
      };

      // Listen on both main namespace and tools namespace
      this.io.once('navigatePageSuccess', responseHandler);
      this.toolsNamespace.once('navigatePageSuccess', responseHandler);

      // Send request to Next.js client via both namespaces
      console.log('🌉 HTTP Bridge: Sending navigatePage request to Next.js client:', page);
      this.io.to(nextJsSession.id).emit('navigatePage', page);
      this.toolsNamespace.to(nextJsSession.id).emit('navigatePage', page);
    });
  }

  // =============================================================================
  // Form and Tool Utilities (existing methods)
  // =============================================================================

  // Helper methods for common events
  public emitFormReceived(data: any): void {
    this.broadcast('form:received', {
      timestamp: new Date().toISOString(),
      data
    });
  }

  public emitFormProcessing(message: string): void {
    this.broadcast('form:processing', {
      timestamp: new Date().toISOString(),
      message
    });
  }

  public emitFormSubmitted(success: boolean, response?: any): void {
    this.broadcast('form:submitted', {
      timestamp: new Date().toISOString(),
      success,
      response
    });
  }

  public emitFormError(error: string): void {
    this.broadcast('form:error', {
      timestamp: new Date().toISOString(),
      error
    });
  }

  public emitToolStatus(tool: string, status: string, data?: any): void {
    this.broadcast('tool:status', {
      tool,
      status,
      data
    });
  }
}

// Singleton instance
let socketManager: SocketManager | null = null;

export const initializeSocketManager = (server: HttpServer): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
};

export const getSocketManager = (): SocketManager => {
  if (!socketManager) {
    throw new Error('SocketManager not initialized. Call initializeSocketManager first.');
  }
  return socketManager;
};

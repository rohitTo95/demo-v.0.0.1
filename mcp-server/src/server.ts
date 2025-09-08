import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import config from './config';
import { initializeSocketManager } from './utils/socketManager';
import { initializeHttpBridge } from './services/httpToSocketBridge';
import toolRoutes from './routes/toolRoutes';
import mcpRoutes from './routes/mcpRoutes';

// Create Express application
const app: Express = express();
const server = createServer(app);

// Initialize Socket.IO
const socketManager = initializeSocketManager(server);

// Initialize HTTP-to-Socket.IO Bridge (for AI agents)
console.log('🌉 Initializing HTTP-to-Socket.IO bridge...');
const httpBridge = initializeHttpBridge();

// Wait a moment for bridge to connect
setTimeout(() => {
  const bridgeStatus = httpBridge.getStatus();
  console.log(`🌉 HTTP Bridge Status: ${bridgeStatus.connected ? 'Connected' : 'Disconnected'} (Client ID: ${bridgeStatus.clientId})`);
}, 2000);

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? error.message : 'Something went wrong'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime()
  });
});

// API routes
app.use('/tools', toolRoutes);
app.use('/mcp', mcpRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
      availableEndpoints: {
        health: 'GET /health',
        tools: {
          fillForm: 'POST /tools/fill-form',
          bookingFill: 'POST /tools/booking/fill',
          formHealth: 'GET /tools/form/health',
          status: 'GET /tools/status',
          socketTest: 'POST /tools/socket/test (dev only)'
        },
        mcp: {
          currentPage: 'GET|POST /mcp/current-page',
          clickElement: 'POST /mcp/click-element',
          clickableElements: 'GET|POST /mcp/clickable-elements',
          navigate: 'POST /mcp/navigate',
          sessions: 'POST /mcp/sessions',
          health: 'POST /mcp/health'
        }
      }
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    server.listen(config.port, () => {
      console.log(`
🚀 MCP Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Server Info:
   • Port: ${config.port}
   • Environment: ${config.nodeEnv}
   • Next.js API: ${config.nextApiUrl}

🏗️ Architecture:
   • Socket.IO MCP ↔ MCP Server ↔ Next.js App (existing)
   • HTTP AI Agents ↔ HTTP Bridge ↔ Socket.IO MCP ↔ MCP Server (new)

🔗 Available Endpoints:
   • Health Check: http://localhost:${config.port}/health
   • Fill Form: http://localhost:${config.port}/tools/fill-form
   • Booking Fill: http://localhost:${config.port}/tools/booking/fill
   • Form Health: http://localhost:${config.port}/tools/form/health
   • Tool Status: http://localhost:${config.port}/tools/status

🎯 MCP Tools (HTTP Bridge for AI Agents - ALL POST):
   • Current Page: POST http://localhost:${config.port}/mcp/current-page
   • Click Element: POST http://localhost:${config.port}/mcp/click-element
   • Clickable Elements: POST http://localhost:${config.port}/mcp/clickable-elements
   • Navigate Page: POST http://localhost:${config.port}/mcp/navigate
   • Sessions Info: POST http://localhost:${config.port}/mcp/sessions
   • Health Check: POST http://localhost:${config.port}/mcp/health
   • Sessions: GET http://localhost:${config.port}/mcp/sessions
   • MCP Health: GET http://localhost:${config.port}/mcp/health

🔌 Socket.IO:
   • WebSocket endpoint: ws://localhost:${config.port}
   • Tools namespace: ws://localhost:${config.port}/tools
   • Real-time booking events enabled

Ready to receive agent requests! 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, server, socketManager };

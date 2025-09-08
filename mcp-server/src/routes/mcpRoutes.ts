import express from 'express';
import { getHttpBridge } from '../services/httpToSocketBridge';

const router = express.Router();

// Health check endpoint (POST for AI agents)
router.post('/health', (req, res) => {
  const bridge = getHttpBridge();
  const bridgeStatus = bridge.getStatus();
  
  res.status(200).json({
    success: true,
    message: 'MCP Server is running',
    timestamp: new Date().toISOString(),
    architecture: {
      description: 'Hybrid Communication Architecture',
      'AI Agents': 'HTTP POST → HTTP Bridge → Socket.IO MCP',
      'Next.js App': 'Socket.IO WebSockets (direct)',
      'MCP Tools': 'Socket.IO WebSockets (direct)'
    },
    bridge: {
      connected: bridgeStatus.connected,
      clientId: bridgeStatus.clientId,
      reconnectAttempts: bridgeStatus.reconnectAttempts
    },
    socketNamespaces: ['/', '/tools'],
    httpEndpoints: ['POST /current-page', 'POST /clickable-elements', 'POST /click-element', 'POST /navigate'],
    testClients: {
      'Socket.IO': 'node socket-mcp-test.js',
      'HTTP Bridge': 'curl -X POST commands'
    }
  });
});

// HTTP API for AI Agents - MCP Tool 1: Get Current Page (POST)
router.post('/current-page', async (req, res) => {
  try {
    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const pageData = await bridge.getCurrentPage();
    
    if (pageData) {
      res.status(200).json({
        success: true,
        data: pageData,
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NEXTJS_CLIENT_NOT_FOUND',
          message: 'No Next.js client connected or no response received via bridge',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error getting current page via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get current page via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// HTTP API for AI Agents - MCP Tool 1: Get Current Page (GET - Alternative)
router.get('/current-page', async (req, res) => {
  try {
    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const pageData = await bridge.getCurrentPage();
    
    if (pageData) {
      res.status(200).json({
        success: true,
        data: pageData,
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP (GET)'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NEXTJS_CLIENT_NOT_FOUND',
          message: 'No Next.js client connected or no response received via bridge',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error getting current page via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get current page via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// HTTP API for AI Agents - MCP Tool 2: Get Clickable Elements (POST)
router.post('/clickable-elements', async (req, res) => {
  try {
    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const elements = await bridge.getClickableElements();
    
    if (elements) {
      res.status(200).json({
        success: true,
        data: elements,
        count: elements.length,
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NEXTJS_CLIENT_NOT_FOUND',
          message: 'No Next.js client connected or no response received via bridge',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error getting clickable elements via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get clickable elements via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// HTTP API for AI Agents - MCP Tool 2: Get Clickable Elements (GET - Alternative)
router.get('/clickable-elements', async (req, res) => {
  try {
    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const elements = await bridge.getClickableElements();
    
    if (elements) {
      res.status(200).json({
        success: true,
        data: elements,
        count: elements.length,
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP (GET)'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NEXTJS_CLIENT_NOT_FOUND',
          message: 'No Next.js client connected or no response received via bridge',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error getting clickable elements via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get clickable elements via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// HTTP API for AI Agents - MCP Tool 3: Click Element
router.post('/click-element', async (req, res) => {
  try {
    // Handle both formats: {"name": "element"} and {"input": {"name": "element"}}
    const elementName = req.body.input?.name || req.body.name;
    
    if (!elementName || typeof elementName !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ELEMENT_NAME',
          message: 'Element name is required and must be a string. Expected format: {"name": "element"} or {"input": {"name": "element"}}',
          timestamp: new Date().toISOString(),
          receivedData: req.body
        }
      });
    }

    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const result = await bridge.clickElement(elementName);
    
    if (result) {
      return res.status(200).json({
        success: true,
        data: {
          elementName: elementName,
          result: result
        },
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLICK_FAILED',
          message: `Failed to click element "${elementName}" - no Next.js client or element not found via bridge`,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error clicking element via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to click element via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// HTTP API for AI Agents - MCP Tool 4: Navigate Page
router.post('/navigate', async (req, res) => {
  try {
    // Handle both formats: {"page": "/path"} and {"input": {"page": "/path"}}
    const targetPage = req.body.input?.page || req.body.page;
    
    if (!targetPage || typeof targetPage !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGE_PATH',
          message: 'Page path is required and must be a string. Expected format: {"name": "/path"} or {"input": {"name": "/path"}}',
          timestamp: new Date().toISOString(),
          receivedData: req.body
        }
      });
    }

    const bridge = getHttpBridge();
    
    if (!bridge.isReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BRIDGE_NOT_READY',
          message: 'HTTP-to-Socket.IO bridge is not connected to MCP server',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const result = await bridge.navigatePage(targetPage);
    
    if (result) {
      return res.status(200).json({
        success: true,
        data: {
          targetPage: targetPage,
          result: result
        },
        timestamp: new Date().toISOString(),
        via: 'HTTP Bridge → Socket.IO MCP'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NAVIGATION_FAILED',
          message: `Failed to navigate to "${targetPage}" - no Next.js client or navigation failed via bridge`,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error navigating page via bridge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to navigate page via HTTP bridge',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Sessions endpoint (POST for AI agents)
router.post('/sessions', (req, res) => {
  try {
    const { getSocketManager } = require('../utils/socketManager');
    const socketManager = getSocketManager();
    const sessionInfo = socketManager.getSessionInfo();
    
    res.status(200).json({
      success: true,
      data: {
        ...sessionInfo,
        totalConnected: sessionInfo.total
      },
      timestamp: new Date().toISOString(),
      note: 'Use Socket.IO test client: node socket-mcp-test.js'
    });
  } catch (error) {
    console.error('Error getting session info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session info'
    });
  }
});

export default router;

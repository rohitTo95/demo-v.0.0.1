# MCP Server - Model Context Protocol Server

A lightweight, scalable MCP server using Express and Socket.io that manages real-time control of Next.js frontend applications.

## 🚀 Features

- **Real-time Communication**: WebSocket-based communication with Next.js clients
- **Session Management**: Track multiple connected clients independently
- **MCP Tools**: Complete implementation of 4 core MCP tools
- **HTTP + WebSocket APIs**: Both REST endpoints and WebSocket events
- **Error Handling**: Comprehensive error handling and validation
- **Rate Limiting**: Built-in protection against abuse
- **Testing Suite**: Complete test client with mock Next.js client

## 🛠️ MCP Tools Implemented

### ✅ Tool 1: getCurrentPage()
- **WebSocket**: Emit `'getCurrentPage'` → Receive `'currentPageData'`
- **HTTP**: `GET /mcp/current-page`
- **Response**: `{ "currentPage": "/home", "title": "...", "url": "..." }`

### ✅ Tool 2: clickElement(btn-name)
- **WebSocket**: Emit `'clickElement'` with `{ "name": "btn-submit" }` → Receive `'clickElementSuccess'`
- **HTTP**: `POST /mcp/click-element` with `{ "name": "btn-submit" }`
- **Response**: `{ "currentPage": "/confirmation", ... }`

### ✅ Tool 3: getClickableElements()
- **WebSocket**: Emit `'getClickableElements'` → Receive `'clickableElementsData'`
- **HTTP**: `GET /mcp/clickable-elements`
- **Response**: Array of `{ "name": "btn-submit", "description": "..." }`

### ✅ Tool 4: navigatePage(page)
- **WebSocket**: Emit `'navigatePage'` with `"/about"` → Receive `'navigatePageSuccess'`
- **HTTP**: `POST /mcp/navigate` with `{ "page": "/about" }`
- **Response**: `{ "currentPage": "/about", ... }`

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test MCP Tools

#### Start Mock Next.js Client (Terminal 1)
```bash
npm run test:mcp:mock
```

#### Run MCP Tests (Terminal 2)
```bash
npm run test:mcp
```

## 📡 API Endpoints

### Core Server
- **Health Check**: `GET /health`
- **General Info**: `GET /` (404 with endpoint list)

### MCP Tools
- **Current Page**: `GET /mcp/current-page`
- **Click Element**: `POST /mcp/click-element`
- **Clickable Elements**: `GET /mcp/clickable-elements`
- **Navigate Page**: `POST /mcp/navigate`
- **Session Info**: `GET /mcp/sessions`
- **MCP Health**: `GET /mcp/health`

### Legacy Tools
- **Fill Form**: `POST /tools/fill-form`
- **Booking Fill**: `POST /tools/booking/fill`
- **Form Health**: `GET /tools/form/health`
- **Tool Status**: `GET /tools/status`

## 🔌 WebSocket Events

### Client → Server (MCP Requests)
```javascript
// Tool 1: Get Current Page
socket.emit('getCurrentPage');

// Tool 2: Click Element
socket.emit('clickElement', { name: 'btn-login' });

// Tool 3: Get Clickable Elements
socket.emit('getClickableElements');

// Tool 4: Navigate Page
socket.emit('navigatePage', '/rooms');

// Next.js Client Registration
socket.emit('register:nextjs');
```

### Server → Client (MCP Responses)
```javascript
// Current page response
socket.on('currentPageData', (data) => {
  console.log('Current page:', data.currentPage);
});

// Clickable elements response
socket.on('clickableElementsData', (elements) => {
  console.log('Found elements:', elements);
});

// Click success response
socket.on('clickElementSuccess', (data) => {
  console.log('Page after click:', data.currentPage);
});

// Navigation success response
socket.on('navigatePageSuccess', (data) => {
  console.log('New page:', data.currentPage);
});

// Error handling
socket.on('error', (error) => {
  console.error('MCP Error:', error);
});
```

## 🧪 Testing

### Run All Tests
```bash
npm run test:full
```

### Test Individual Components
```bash
# Test MCP tools only
npm run test:mcp

# Test with mock client
npm run test:mcp:mock

# Test booking functionality
npm run test:booking
```

### Manual Testing with curl

#### Get Current Page
```bash
curl http://localhost:3001/mcp/current-page
```

#### Click Element
```bash
curl -X POST http://localhost:3001/mcp/click-element \
  -H "Content-Type: application/json" \
  -d '{"name": "btn-submit"}'
```

#### Get Clickable Elements
```bash
curl http://localhost:3001/mcp/clickable-elements
```

#### Navigate Page
```bash
curl -X POST http://localhost:3001/mcp/navigate \
  -H "Content-Type: application/json" \
  -d '{"page": "/about"}'
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agent      │◄──►│   MCP Server    │◄──►│  Next.js App    │
│   (External)    │    │  (This Server)  │    │  (Frontend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
    HTTP/WS                 Session Mgmt           DOM Events
     Requests                & Routing             & Responses
```

### Key Components

- **Express Server**: HTTP API endpoints
- **Socket.IO**: Real-time WebSocket communication
- **Session Manager**: Track client connections and state
- **Route Handlers**: HTTP request processing
- **Error Handler**: Comprehensive error management

## 📊 Session Management

The server tracks client sessions with the following features:

- **Client Identification**: Unique socket IDs for each connection
- **Next.js Client Detection**: Automatic detection of frontend clients
- **Activity Tracking**: Monitor last activity for cleanup
- **Automatic Cleanup**: Remove inactive sessions after 5 minutes

### Get Session Info
```bash
curl http://localhost:3001/mcp/sessions
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 2,
    "nextJsClients": 1,
    "totalConnected": 2,
    "activeSessions": [...]
  }
}
```

## 🛡️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "NEXTJS_CLIENT_NOT_FOUND",
    "message": "No Next.js client connected",
    "timestamp": "2025-09-07T16:46:16.536Z"
  }
}
```

### Error Codes
- `NEXTJS_CLIENT_NOT_FOUND`: No Next.js client connected
- `INVALID_ELEMENT_NAME`: Element name missing or invalid
- `INVALID_PAGE_PATH`: Page path missing or invalid
- `CLICK_FAILED`: Element click operation failed
- `NAVIGATION_FAILED`: Page navigation failed
- `INTERNAL_ERROR`: Server internal error

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Next.js API URL
NEXT_API_URL=http://localhost:3000/api

# Logging
LOG_LEVEL=info
```

### Default Configuration
- **Port**: 3001
- **CORS**: Allow all origins in development
- **Next.js API**: http://localhost:3000/api
- **Log Level**: info

## 🚦 Production Deployment

### Build and Start
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Production Considerations
1. **Environment Variables**: Set proper CORS origins
2. **SSL/TLS**: Use secure WebSocket connections (wss://)
3. **Load Balancing**: Handle multiple MCP clients
4. **Monitoring**: Add comprehensive logging and metrics
5. **Authentication**: Implement client authentication
6. **Rate Limiting**: Configure per-client limits

## 🔍 Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### Monitor WebSocket Connections
```bash
# Check active sessions
curl http://localhost:3001/mcp/sessions

# Check MCP health
curl http://localhost:3001/mcp/health
```

### Test Client Commands
```bash
# Start mock client for testing
node mcp-test-client.js --mock-client

# Run full test suite
node mcp-test-client.js

# Get help
node mcp-test-client.js --help
```

## 📝 Integration with Next.js

To integrate with your Next.js application, implement the following in your frontend:

### 1. Connect to MCP Server
```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');

// Register as Next.js client
socket.emit('register:nextjs');
```

### 2. Handle MCP Requests
```javascript
// Handle getCurrentPage requests
socket.on('getCurrentPage', () => {
  socket.emit('currentPageData', {
    currentPage: window.location.pathname,
    title: document.title,
    url: window.location.href
  });
});

// Handle clickElement requests
socket.on('clickElement', (data) => {
  const element = document.querySelector(`[data-clickable-element="${data.name}"]`);
  if (element) {
    element.click();
    socket.emit('clickElementSuccess', {
      currentPage: window.location.pathname,
      title: document.title,
      url: window.location.href
    });
  }
});

// Handle getClickableElements requests
socket.on('getClickableElements', () => {
  const elements = Array.from(document.querySelectorAll('[data-clickable-element]'))
    .map(el => ({
      name: el.getAttribute('data-clickable-element'),
      description: el.getAttribute('data-element-description') || 'No description',
      type: el.tagName.toLowerCase(),
      isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
    }));
  
  socket.emit('clickableElementsData', elements);
});

// Handle navigatePage requests
socket.on('navigatePage', (page) => {
  // Use Next.js router
  router.push(page).then(() => {
    socket.emit('navigatePageSuccess', {
      currentPage: page,
      title: document.title,
      url: window.location.href
    });
  });
});
```

### 3. Add Clickable Elements
```jsx
<button 
  data-clickable-element="booking-submit"
  data-element-description="Submit booking form and proceed to payment"
  onClick={handleSubmit}
>
  Submit Booking
</button>
```

## 📚 Related Documentation

- [MCP_SERVER_CONNECTION_GUIDE.md](./MCP_SERVER_CONNECTION_GUIDE.md) - Detailed connection guide
- [MCP_ERROR_HANDLING_COMPLETE.md](./MCP_ERROR_HANDLING_COMPLETE.md) - Error handling documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License

---

## 🎯 Quick Test Commands

```bash
# Start everything
npm run dev

# In another terminal - start mock client
npm run test:mcp:mock

# In another terminal - run tests
npm run test:mcp
```

**Ready to control your Next.js app with AI agents! 🚀**

# MCP Server API Documentation

## Overview

The MCP (Model Context Protocol) Server provides a powerful API for controlling and interacting with Next.js web applications. It offers both WebSocket and HTTP endpoints for real-time browser automation, page navigation, and form interactions.

## Server Endpoints

### Base URL
```
http://localhost:3001
```

### Available Endpoints
- `GET /health` - Server health check and client status
- `POST /mcp` - MCP JSON-RPC 2.0 API endpoint
- `WebSocket /tools` - Real-time WebSocket connection for Next.js clients

---

## 🩺 Health Check

### Endpoint
```http
GET /health
```

### Description
Returns server status and currently connected client information.

### Example Response
```json
{
  "status": "healthy",
  "server": "MCP Server",
  "timestamp": "2025-09-09T13:35:44.501Z",
  "connectedClients": ["Q8mp4i91qZtWiJNLAAAB", "eesZTu4mt0vyZQA_AAAD"],
  "clientCount": 2
}
```

### CURL Example
```bash
curl -X GET http://localhost:3001/health
```

### Postman Example
```
Method: GET
URL: http://localhost:3001/health
Headers: (none required)
```

---

## 🛠️ Available Tools

The MCP server provides 5 main tools for browser automation:

1. **getCurrentPage** - Get current page information
2. **getClickableElements** - Get clickable elements on current page  
3. **clickElement** - Click a named element
4. **navigatePage** - Navigate to a page
5. **fillBookingForm** - Fill booking form

---

## 📝 JSON-RPC 2.0 API

### Endpoint
```http
POST /mcp
```

### Headers
```
Content-Type: application/json
```

### Request Format
All requests follow JSON-RPC 2.0 specification:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method_name",
  "params": {
    "key": "value"
  }
}
```

---

## 🔧 Tool Methods

### 1. List Available Tools

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

#### Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {"name": "getCurrentPage", "description": "Get current page information"},
      {"name": "getClickableElements", "description": "Get clickable elements on current page"},
      {"name": "clickElement", "description": "Click a named element"},
      {"name": "navigatePage", "description": "Navigate to a page"},
      {"name": "fillBookingForm", "description": "Fill booking form"}
    ]
  }
}
```

---

### 2. Get Current Page

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "getCurrentPage",
    "arguments": {
      "sessionId": "Q8mp4i91qZtWiJNLAAAB"
    }
  }
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "getCurrentPage",
      "arguments": {}
    }
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "getCurrentPage",
    "arguments": {}
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"url\": \"http://localhost:3000/\",\n  \"title\": \"Hotel Demo\",\n  \"path\": \"/\"\n}"
      }
    ]
  }
}
```

---

### 3. Get Clickable Elements

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "getClickableElements",
    "arguments": {}
  }
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "getClickableElements",
      "arguments": {}
    }
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "getClickableElements",
    "arguments": {}
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"name\": \"rooms-link\",\n    \"text\": \"Rooms\",\n    \"type\": \"link\",\n    \"href\": \"/rooms\"\n  },\n  {\n    \"name\": \"contact-link\",\n    \"text\": \"Contact\",\n    \"type\": \"link\",\n    \"href\": \"/contact\"\n  }\n]"
      }
    ]
  }
}
```

---

### 4. Click Element

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "clickElement",
    "arguments": {
      "name": "rooms-link"
    }
  }
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "clickElement",
      "arguments": {
        "name": "rooms-link"
      }
    }
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "clickElement",
    "arguments": {
      "name": "rooms-link"
    }
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"currentPage\": {\n    \"url\": \"http://localhost:3000/rooms\",\n    \"title\": \"Rooms - Hotel Demo\",\n    \"path\": \"/rooms\"\n  }\n}"
      }
    ]
  }
}
```

---

### 5. Navigate Page

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "navigatePage",
    "arguments": {
      "page": "/contact"
    }
  }
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "navigatePage",
      "arguments": {
        "page": "/contact"
      }
    }
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "navigatePage",
    "arguments": {
      "page": "/contact"
    }
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"currentPage\": {\n    \"url\": \"http://localhost:3000/contact\",\n    \"title\": \"Contact - Hotel Demo\",\n    \"path\": \"/contact\"\n  }\n}"
      }
    ]
  }
}
```

---

### 6. Fill Booking Form

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "fillBookingForm",
    "arguments": {
      "checkIn": "2025-09-15",
      "checkOut": "2025-09-20",
      "guests": 2,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

#### CURL Example
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "fillBookingForm",
      "arguments": {
        "checkIn": "2025-09-15",
        "checkOut": "2025-09-20",
        "guests": 2,
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  }'
```

#### Postman Example
```
Method: POST
URL: http://localhost:3001/mcp
Headers: Content-Type: application/json
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "fillBookingForm",
    "arguments": {
      "checkIn": "2025-09-15",
      "checkOut": "2025-09-20",
      "guests": 2,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"message\": \"Form filling not yet implemented\",\n  \"formData\": {\n    \"checkIn\": \"2025-09-15\",\n    \"checkOut\": \"2025-09-20\",\n    \"guests\": 2,\n    \"name\": \"John Doe\",\n    \"email\": \"john.doe@example.com\"\n  }\n}"
      }
    ]
  }
}
```

---

## 🔄 Session Management

### Client Auto-Selection
- If no `sessionId` is provided, the server automatically selects the best available client
- The server uses stale connection cleanup to ensure only active clients are used
- Clients are selected based on most recent connection

### Using Specific Session ID
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "getCurrentPage",
    "arguments": {
      "sessionId": "Q8mp4i91qZtWiJNLAAAB"
    }
  }
}
```

---

## ⚠️ Error Handling

### Common Error Responses

#### No Clients Connected
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "No Next.js client connected",
    "data": {
      "tool": "getCurrentPage",
      "args": {}
    }
  }
}
```

#### Timeout Error
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Timeout",
    "data": {
      "tool": "getCurrentPage",
      "args": {}
    }
  }
}
```

#### Invalid Method
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

#### Parse Error
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32700,
    "message": "Parse error"
  }
}
```

---

## 🚀 Getting Started

### Prerequisites
1. MCP Server running on port 3001
2. Next.js application with MCP client integration
3. Both applications connected via WebSocket

### Quick Start with Postman

1. **Import Collection**: Create a new Postman collection with the examples above
2. **Set Base URL**: Create environment variable `{{baseUrl}}` = `http://localhost:3001`
3. **Test Health**: Start with `GET {{baseUrl}}/health`
4. **List Tools**: Use `POST {{baseUrl}}/mcp` with tools/list method
5. **Execute Tools**: Try getCurrentPage, getClickableElements, etc.

### Quick Start with CURL

1. **Check Server Status**:
   ```bash
   curl -X GET http://localhost:3001/health
   ```

2. **List Available Tools**:
   ```bash
   curl -X POST http://localhost:3001/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

3. **Get Current Page**:
   ```bash
   curl -X POST http://localhost:3001/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"getCurrentPage","arguments":{}}}'
   ```

---

## 🔧 Server Configuration

### Starting the Server
```bash
cd mcp-server
npm install
npm run build
npm start http
```

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode

### WebSocket Configuration
- **Namespace**: `/tools`
- **Transports**: `websocket`, `polling`
- **CORS**: Enabled for all origins

---

## 📚 Advanced Usage

### Batch Operations
You can send multiple requests in sequence to perform complex automation workflows:

1. Get current page
2. Get clickable elements
3. Click specific element
4. Verify navigation

### Error Recovery
The server includes automatic stale connection cleanup and will retry operations with different clients if available.

### Debugging
- Enable server logs for detailed request/response tracking
- Use browser developer tools to monitor WebSocket connections
- Check `/health` endpoint for connection status

---

## 🎯 Use Cases

- **Web Testing**: Automated UI testing and validation
- **Browser Automation**: Programmatic navigation and interaction
- **Form Filling**: Automated form completion
- **Page Monitoring**: Real-time page state monitoring
- **Integration Testing**: API-driven browser testing

---

## 📞 Support

For issues and questions:
1. Check server logs for error details
2. Verify client connections via `/health` endpoint
3. Ensure proper JSON-RPC 2.0 formatting
4. Check network connectivity between client and server

---

*Last updated: September 9, 2025*

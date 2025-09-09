# MCP Server Quick Reference

## 🚀 Quick Start

### Server Health Check
```bash
curl -X GET http://localhost:3001/health
```

### List Available Tools
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 🛠️ Available Tools

### 1. getCurrentPage
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"getCurrentPage","arguments":{}}}'
```

### 2. getClickableElements
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"getClickableElements","arguments":{}}}'
```

### 3. clickElement
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"clickElement","arguments":{"name":"rooms-link"}}}'
```

### 4. navigatePage
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"navigatePage","arguments":{"page":"/contact"}}}'
```

### 5. fillBookingForm
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"fillBookingForm","arguments":{"checkIn":"2025-09-15","checkOut":"2025-09-20","guests":2,"name":"John Doe","email":"john.doe@example.com"}}}'
```

## 📱 Postman Collection JSON

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "MCP Server API",
    "description": "Collection for testing MCP Server tools",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "List Tools",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/list\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    },
    {
      "name": "Get Current Page",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 2,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"getCurrentPage\",\n    \"arguments\": {}\n  }\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    },
    {
      "name": "Get Clickable Elements",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 3,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"getClickableElements\",\n    \"arguments\": {}\n  }\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    },
    {
      "name": "Click Element",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 4,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"clickElement\",\n    \"arguments\": {\n      \"name\": \"rooms-link\"\n    }\n  }\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    },
    {
      "name": "Navigate Page",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 5,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"navigatePage\",\n    \"arguments\": {\n      \"page\": \"/contact\"\n    }\n  }\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    },
    {
      "name": "Fill Booking Form",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 6,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"fillBookingForm\",\n    \"arguments\": {\n      \"checkIn\": \"2025-09-15\",\n      \"checkOut\": \"2025-09-20\",\n      \"guests\": 2,\n      \"name\": \"John Doe\",\n      \"email\": \"john.doe@example.com\"\n    }\n  }\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/mcp",
          "host": ["{{baseUrl}}"],
          "path": ["mcp"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    }
  ]
}
```

## ⚙️ Environment Setup

Create a Postman environment with:
- `baseUrl`: `http://localhost:3001`

## 🎯 Tool Names Summary

| Tool Name | Description |
|-----------|-------------|
| `getCurrentPage` | Get current page information |
| `getClickableElements` | Get clickable elements on current page |
| `clickElement` | Click a named element |
| `navigatePage` | Navigate to a page |
| `fillBookingForm` | Fill booking form |

## 🔍 Debugging

### Check Server Status
```bash
curl -X GET http://localhost:3001/health
```

### View Connected Clients
The health endpoint shows `connectedClients` array with active socket IDs.

### Common Issues
- **No clients connected**: Start the Next.js app and ensure WebSocket connection
- **Timeout errors**: Client may be disconnected or unresponsive
- **Parse errors**: Check JSON formatting in requests

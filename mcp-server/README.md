# Simple MCP Server for Hotel Booking

A minimal MCP server that provides tools for interacting with a Next.js hotel booking app.

## Tools

- `getCurrentPage` - Get current page info
- `getClickableElements` - List clickable elements  
- `clickElement` - Click named elements
- `navigatePage` - Navigate to pages
- `fillBookingForm` - Fill booking forms

## Usage

```bash
# Build
npm run build

# Start MCP server (STDIO)
npm start

# Start with Socket.IO bridge
npm start http

# Test
npm test
```

## Integration

The server communicates with Next.js via Socket.IO WebSockets. The Next.js app should emit MCP events when the server requests actions.

## Files

- `src/mcpMain.ts` - Main server implementation
- `src/types/mcp.ts` - TypeScript interfaces
- `package.json` - Dependencies and scripts
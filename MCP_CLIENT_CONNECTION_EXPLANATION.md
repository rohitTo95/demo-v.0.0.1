# MCP Server Client Connection Issues - Fixed

## Issues Identified

### 1. Double Registration Problem
**Problem**: Each client connecting to the `/tools` namespace was being registered twice:
- Once automatically on connection (line 397)
- Once explicitly when receiving the `register:nextjs` event (lines 401-405)

**Evidence from logs**:
```
✅ [TOOLS] Auto-registered Next.js client: MxIWg332ytqxD3dsAAAB
✅ [TOOLS] Next.js client explicitly registered: MxIWg332ytqxD3dsAAAB
```

### 2. Incorrect Client Count Timing
**Problem**: The "Total clients connected" was logged before adding the new client to the Map, showing the old count.

**Evidence from logs**:
```
🔌 [TOOLS] Client connected to tools namespace: R34V06tO5CghnUacAAAD
🔌 [TOOLS] Total clients connected: 1  // Should be 2 after this connection
```

### 3. Multiple Client Connections Explanation
**Why you see multiple clients**:
- Browser refresh/reconnection creates new socket connections
- Each tab/window creates a separate connection
- Previous connections might not have been properly cleaned up
- Development hot-reload can cause multiple connections

## Fixes Applied

### 1. Fixed Double Registration
**Before**:
```typescript
// Auto-register immediately
this.nextjsClients.set(socket.id, socket);

socket.on('register:nextjs', () => {
  // Register again (duplicate!)
  this.nextjsClients.set(socket.id, socket);
});
```

**After**:
```typescript
// Auto-register immediately
this.nextjsClients.set(socket.id, socket);

socket.on('register:nextjs', () => {
  if (this.nextjsClients.has(socket.id)) {
    console.log(`ℹ️ [TOOLS] Next.js client ${socket.id} already registered (skipping duplicate)`);
  } else {
    this.nextjsClients.set(socket.id, socket);
    console.log(`✅ [TOOLS] Next.js client explicitly registered: ${socket.id}`);
  }
});
```

### 2. Fixed Client Count Timing
**Before**:
```typescript
console.log(`🔌 [TOOLS] Client connected to tools namespace: ${socket.id}`);
console.log(`🔌 [TOOLS] Total clients connected: ${this.nextjsClients.size}`);
// Register client AFTER logging count
this.nextjsClients.set(socket.id, socket);
```

**After**:
```typescript
// Register client FIRST
this.nextjsClients.set(socket.id, socket);
// Then log correct count
console.log(`🔌 [TOOLS] Client connected to tools namespace: ${socket.id}`);
console.log(`🔌 [TOOLS] Total clients connected: ${this.nextjsClients.size}`);
```

## Expected Behavior After Fix

### Single Client Connection:
```
🔌 [TOOLS] Client connected to tools namespace: ABC123
🔌 [TOOLS] Total clients connected: 1
✅ [TOOLS] Auto-registered Next.js client: ABC123
✅ [TOOLS] Updated client list: [ 'ABC123' ]
ℹ️ [TOOLS] Next.js client ABC123 already registered (skipping duplicate)
```

### Multiple Client Connections:
Each new **unique** client connection will show:
```
🔌 [TOOLS] Client connected to tools namespace: DEF456
🔌 [TOOLS] Total clients connected: 2
✅ [TOOLS] Auto-registered Next.js client: DEF456
✅ [TOOLS] Updated client list: [ 'ABC123', 'DEF456' ]
```

## Why Multiple Connections Still Happen

Multiple connections are **normal** in these scenarios:

1. **Browser Refresh**: Creates new socket connection, old one disconnects
2. **Multiple Tabs**: Each tab = separate connection
3. **Development Mode**: Hot reload may create temporary additional connections
4. **Network Issues**: Reconnection attempts can create multiple sockets
5. **Component Remounting**: React component lifecycle can trigger reconnections

## Testing the Fix

1. **Start MCP Server**:
   ```bash
   cd mcp-server
   npm run build
   npm start http
   ```

2. **Start Next.js App**:
   ```bash
   cd site
   npm run dev
   ```

3. **Expected Clean Logs**:
   - Only one registration message per unique client
   - Correct client count
   - Duplicate registration prevention

4. **Test Multiple Connections**:
   - Open multiple browser tabs → Each shows separate connection
   - Refresh page → Old connection disconnects, new one connects
   - Close tab → Connection properly disconnects

## Monitoring Connection Health

To monitor connection health, watch for:
- **Clean disconnections**: `❌ [TOOLS] Client disconnected`
- **Proper cleanup**: Client list updates correctly
- **No memory leaks**: Client Map doesn't grow indefinitely
- **Single registration**: No duplicate registration messages

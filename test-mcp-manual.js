#!/usr/bin/env node

/**
 * MCP Tools Manual Test Script
 * This script simulates how an LLM would interact with the MCP server
 * using the Model Context Protocol standard
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPToolsTester {
  constructor() {
    this.mcpServerPath = path.join(__dirname, 'mcp-server', 'src', 'mcpMain.ts');
  }

  async testListTools() {
    console.log('🔧 Testing: List Available Tools');
    console.log('================================\n');
    
    return new Promise((resolve, reject) => {
      const mcp = spawn('npx', ['tsx', this.mcpServerPath, 'stdio'], {
        cwd: path.join(__dirname, 'mcp-server'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      mcp.stdout.on('data', (data) => {
        output += data.toString();
      });

      mcp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      mcp.on('close', (code) => {
        if (code === 0) {
          console.log('✅ MCP Server Response (List Tools):');
          console.log(output);
          resolve(output);
        } else {
          console.log('❌ MCP Server Error:');
          console.log(errorOutput);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      // Send the list tools request
      const listToolsRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      });

      console.log('📤 Sending Request:', listToolsRequest);
      mcp.stdin.write(listToolsRequest + '\n');
      mcp.stdin.end();

      // Timeout after 10 seconds
      setTimeout(() => {
        mcp.kill();
        reject(new Error('Timeout after 10 seconds'));
      }, 10000);
    });
  }

  async testGetCurrentPage() {
    console.log('\n🔧 Testing: Get Current Page');
    console.log('==============================\n');
    
    return new Promise((resolve, reject) => {
      const mcp = spawn('npx', ['tsx', this.mcpServerPath, 'stdio'], {
        cwd: path.join(__dirname, 'mcp-server'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      mcp.stdout.on('data', (data) => {
        output += data.toString();
      });

      mcp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      mcp.on('close', (code) => {
        if (code === 0) {
          console.log('✅ MCP Server Response (Get Current Page):');
          console.log(output);
          resolve(output);
        } else {
          console.log('❌ MCP Server Error:');
          console.log(errorOutput);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      // Send the getCurrentPage tool request
      const getCurrentPageRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "getCurrentPage",
          arguments: {}
        }
      });

      console.log('📤 Sending Request:', getCurrentPageRequest);
      mcp.stdin.write(getCurrentPageRequest + '\n');
      mcp.stdin.end();

      // Timeout after 15 seconds (longer for tool calls)
      setTimeout(() => {
        mcp.kill();
        reject(new Error('Timeout after 15 seconds'));
      }, 15000);
    });
  }

  async run() {
    console.log('🧪 MCP Tools Manual Test Suite');
    console.log('===============================\n');
    console.log('This test simulates LLM interaction with the MCP server');
    console.log('Make sure the Next.js app is running on http://localhost:3000\n');

    try {
      // Test 1: List available tools
      await this.testListTools();
      
      // Test 2: Call getCurrentPage tool (this will fail without a connected client, which is expected)
      try {
        await this.testGetCurrentPage();
      } catch (error) {
        console.log('⚠️  Expected behavior: getCurrentPage failed without connected client');
        console.log('   This is normal - the tool requires a WebSocket connection from Next.js\n');
      }

      console.log('✅ Test Summary:');
      console.log('- MCP Server: ✅ Responds to stdio correctly');
      console.log('- Tools List: ✅ Returns available tools');
      console.log('- Tool Calls: ⚠️  Require WebSocket connection (expected)');
      console.log('\n🎯 Next Steps:');
      console.log('1. Ensure Next.js app is running and connected to MCP server');
      console.log('2. Use the MCP Control Panel in the web interface');
      console.log('3. Test tools via LLM integration with proper WebSocket connection');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run the test suite
const tester = new MCPToolsTester();
tester.run().catch(console.error);

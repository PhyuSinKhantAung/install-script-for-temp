#!/usr/bin/env node
/**
 * ES6 MCP Template Installer with Auto-Generated Tools
 * Creates template that generates MCP servers with automatic tool registration from OpenAPI specs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ES6MCPTemplateInstaller {
  constructor() {
    this.homeDir = os.homedir();
    this.templateDir = path.join(this.homeDir, '.openapi-generator', 'templates', 'nodejs-mcp-server');
  }

  createDirectories() {
    const dirs = [
      path.join(this.homeDir, '.openapi-generator'),
      path.join(this.homeDir, '.openapi-generator', 'templates'),
      this.templateDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  getTemplateFiles() {
    return {
      'config.yaml': `# ES6 MCP Server Template Configuration
generatorName: nodejs-mcp-server
helpTxt: "Generates a Node.js MCP server with ES6 modules and automatic tool registration"

# Supporting files to generate
supportingFiles:
  - templateFile: "package.mustache"
    destinationFile: "package.json"
  - templateFile: "README.mustache"
    destinationFile: "README.md"
  - templateFile: "logger.mustache"
    destinationFile: "utils/logger.js"
  - templateFile: "response.mustache"
    destinationFile: "utils/response.js"
  - templateFile: "apiClient.mustache"
    destinationFile: "utils/apiClient.js"
  - templateFile: "toolsIndex.mustache"
    destinationFile: "tools/index.js"
  - templateFile: "serverTest.mustache"
    destinationFile: "tests/server.test.js"
  - templateFile: "envExample.mustache"
    destinationFile: ".env.example"

# Don't generate model/api files (we handle everything in our structure)
modelTemplateFiles: {}
apiTemplateFiles: {}

# Main files to generate
files:
  index.js: index.mustache
`,

      'index.mustache': `#!/usr/bin/env node
/**
 * {{appName}} MCP Server
 * {{appDescription}}
 * Generated from OpenAPI specification
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import tools from "./tools/index.js";
import logger from "./utils/logger.js";

const server = new McpServer({
  name: "{{packageName}}",
  version: "{{appVersion}}"
});

// Register all tools automatically
for (const tool of tools) {
  server.registerTool(tool.name, tool.schema, tool.handler);
  logger.info('Registered tool: ' + tool.name);
}

const transport = new StdioServerTransport();

async function main() {
  try {
    logger.info("{{appName}} MCP Server is connecting...");
    await server.connect(transport);
    logger.info("{{appName}} MCP Server connected successfully!");
  } catch (error) {
    logger.error("Error occurred while trying to connect to server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

if (import.meta.url === 'file://' + process.argv[1]) {
  main();
}

export default server;
`,

      'package.mustache': `{
  "name": "{{packageName}}",
  "version": "{{appVersion}}",
  "description": "{{appDescription}} - MCP Server",
  "type": "module",
  "main": "index.js",
  "bin": {
    "{{packageName}}": "./index.js"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "node --inspect index.js",
    "test": "mocha tests/**/*.test.js --experimental-loader @babel/register",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "winston": "^3.8.0",
    "node-fetch": "^3.3.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0",
    "sinon": "^15.0.0",
    "eslint": "^8.0.0",
    "@babel/core": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/register": "^7.22.0"
  },
  "keywords": ["mcp", "model-context-protocol", "server", "stdio", "openapi", "{{packageName}}"],
  "author": "",
  "license": "{{licenseName}}",
  "engines": {
    "node": ">=18.0.0"
  }
}`,

      'toolsIndex.mustache': `/**
 * Auto-generated tools for {{appName}}
 * Each tool corresponds to an OpenAPI operation
 */

import { formatResponse } from "../utils/response.js";
import { getApiClient } from "../utils/apiClient.js";
import logger from "../utils/logger.js";

{{#operations}}
{{#operation}}
/**
 * {{summary}}
 * {{httpMethod}} {{path}}
 */
const {{operationIdCamelCase}} = {
  name: "{{operationIdCamelCase}}",
  schema: {
    title: "{{summary}}",
    description: "{{summary}}{{#notes}} - {{notes}}{{/notes}}",
    properties: {
{{#allParams}}
      {{paramName}}: {
        type: "{{dataType}}",
        description: "{{description}}"{{#required}},
        required: true{{/required}}
      }{{#hasMore}},{{/hasMore}}
{{/allParams}}
    }
  },
  handler: async (args) => {
    try {
      const apiClient = getApiClient();
      
      // Extract parameters for API call
      const params = {};
      const queryParams = {};
      const pathParams = {};
      const requestBody = {};
      
{{#allParams}}
      {{#isPathParam}}
      if (args.{{paramName}} !== undefined) {
        pathParams['{{paramName}}'] = args.{{paramName}};
      }
      {{/isPathParam}}
      {{#isQueryParam}}
      if (args.{{paramName}} !== undefined) {
        queryParams['{{paramName}}'] = args.{{paramName}};
      }
      {{/isQueryParam}}
      {{#isBodyParam}}
      if (args.{{paramName}} !== undefined) {
        requestBody['{{paramName}}'] = args.{{paramName}};
      }
      {{/isBodyParam}}
{{/allParams}}

      // Build API endpoint URL
      let endpoint = "{{path}}";
      {{#pathParams}}
      endpoint = endpoint.replace('{{{baseName}}}', pathParams['{{paramName}}'] || '');
      {{/pathParams}}
      
      // Prepare request options
      const requestOptions = {
        method: '{{httpMethod}}',
        endpoint: endpoint
      };
      
      if (Object.keys(queryParams).length > 0) {
        requestOptions.queryParams = queryParams;
      }
      
      {{#hasBodyParam}}
      if (Object.keys(requestBody).length > 0) {
        requestOptions.body = requestBody;
      }
      {{/hasBodyParam}}
      
      // Make API call
      const response = await apiClient.request(requestOptions);
      
      return formatResponse({
        message: "{{summary}} completed successfully",
        data: response
      });
      
    } catch (error) {
      logger.error('Error in {{operationIdCamelCase}}:', error);
      return formatResponse({
        type: "error",
        message: '{{summary}} failed: ' + (error.message || JSON.stringify(error))
      });
    }
  }
};

{{/operation}}
{{/operations}}

// Export all tools
export default [
{{#operations}}
{{#operation}}
  {{operationIdCamelCase}}{{#hasMore}},{{/hasMore}}
{{/operation}}
{{/operations}}
];
`,

      'logger.mustache': `/**
 * Logger utility for {{appName}}
 * ES6 Module version
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '{{packageName}}' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
`,

      'response.mustache': `/**
 * Response formatting utility for {{appName}}
 * Formats responses in MCP-compatible format
 */

export function formatResponse({ type = "success", message = "", data = null }) {
  const response = {
    content: []
  };

  if (type === "error") {
    response.content.push({
      type: "text",
      text: "❌ " + message
    });
  } else {
    if (message) {
      response.content.push({
        type: "text", 
        text: "✅ " + message
      });
    }

    if (data) {
      // Format data based on type
      let formattedData;
      if (Array.isArray(data)) {
        formattedData = data.length + " items:\\n" + 
          data.map((item, index) => {
            if (typeof item === 'object') {
              return (index + 1) + ". " + JSON.stringify(item, null, 2);
            }
            return (index + 1) + ". " + item;
          }).join("\\n");
      } else if (typeof data === 'object') {
        formattedData = JSON.stringify(data, null, 2);
      } else {
        formattedData = String(data);
      }

      response.content.push({
        type: "text",
        text: formattedData
      });
    }
  }

  return response;
}

export default { formatResponse };
`,

      'apiClient.mustache': `/**
 * API Client utility for {{appName}}
 * Handles authentication and API requests
 */

import fetch from 'node-fetch';
import logger from './logger.js';

class ApiClient {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || '{{basePath}}{{^basePath}}https://api.example.com{{/basePath}}';
    this.accessToken = null;
  }

  /**
   * Get access token from environment or CLI args
   */
  getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Try environment variable first
    this.accessToken = process.env.API_TOKEN || process.env.ACCESS_TOKEN;
    
    if (!this.accessToken) {
      // Try to get from CLI arguments
      const tokenIndex = process.argv.indexOf('--token');
      if (tokenIndex !== -1 && process.argv[tokenIndex + 1]) {
        this.accessToken = process.argv[tokenIndex + 1];
      }
    }

    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  async request({ method = 'GET', endpoint, queryParams = {}, body = null, headers = {} }) {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token provided. Use --token argument or set API_TOKEN environment variable');
    }

    // Build URL with query parameters
    const url = new URL(endpoint, this.baseUrl);
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    // Prepare request options
    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'User-Agent': '{{packageName}}/{{appVersion}}',
        ...headers
      }
    };

    // Add body for non-GET requests
    if (body && method.toUpperCase() !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    logger.info('Making API request: ' + method.toUpperCase() + ' ' + url.toString());

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorBody);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
      
    } catch (error) {
      logger.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get(endpoint, queryParams = {}) {
    return this.request({ method: 'GET', endpoint, queryParams });
  }

  async post(endpoint, body = {}) {
    return this.request({ method: 'POST', endpoint, body });
  }

  async put(endpoint, body = {}) {
    return this.request({ method: 'PUT', endpoint, body });
  }

  async patch(endpoint, body = {}) {
    return this.request({ method: 'PATCH', endpoint, body });
  }

  async delete(endpoint) {
    return this.request({ method: 'DELETE', endpoint });
  }
}

let apiClientInstance = null;

export function getApiClient() {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient();
  }
  return apiClientInstance;
}

export { ApiClient };
export default { getApiClient, ApiClient };
`,

      'README.mustache': `# {{appName}}

{{appDescription}}

ES6 MCP server with automatic tool registration from OpenAPI specification.

## Features

- 🚀 **Automatic Tool Generation**: Tools are auto-generated from your OpenAPI operations
- 🔧 **ES6 Modules**: Modern JavaScript with import/export syntax
- 🔐 **Built-in Authentication**: Token-based API authentication
- 📝 **Structured Logging**: Winston-based logging system
- 🎯 **MCP Protocol**: Full Model Context Protocol compatibility
- 📡 **Stdio Transport**: Standard input/output communication

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

### Environment Variables

Create a \`.env\` file:

\`\`\`env
API_TOKEN=your_api_token_here
API_BASE_URL={{basePath}}{{^basePath}}https://api.example.com{{/basePath}}
LOG_LEVEL=info
\`\`\`

### Command Line

You can also pass the API token as a command line argument:

\`\`\`bash
npm start -- --token your_api_token_here
\`\`\`

## Usage

### Standalone
\`\`\`bash
npm start
\`\`\`

### With Claude Desktop

Add to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "{{packageName}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{packageName}}/index.js"],
      "env": {
        "API_TOKEN": "your_api_token_here"
      }
    }
  }
}
\`\`\`

## Available Tools

The following tools are automatically generated from your OpenAPI specification:

{{#operations}}
{{#operation}}
### {{operationIdCamelCase}}

**Description**: {{summary}}  
**Method**: {{httpMethod}} **Path**: {{path}}

**Parameters**:
{{#allParams}}
- \`{{paramName}}\` ({{dataType}}{{#required}}, required{{/required}}): {{description}}
{{/allParams}}

{{/operation}}
{{/operations}}

## Development

### Running in development mode
\`\`\`bash
npm run dev
\`\`\`

### Running tests
\`\`\`bash
npm test
\`\`\`

### Linting
\`\`\`bash
npm run lint
npm run lint:fix
\`\`\`

## Project Structure

\`\`\`
├── index.js              # Main MCP server entry point
├── package.json          # ES6 module configuration
├── tools/
│   └── index.js          # Auto-generated tools from OpenAPI
├── utils/
│   ├── logger.js         # Winston logging
│   ├── response.js       # Response formatting
│   └── apiClient.js      # API client with authentication
├── tests/                # Test files
├── .env.example         # Environment template
└── README.md            # This file
\`\`\`

## Customization

### Adding Custom Tools

You can add custom tools by editing \`tools/index.js\` and adding them to the export array.

### Modifying API Client

The API client in \`utils/apiClient.js\` handles authentication and HTTP requests. You can customize:

- Authentication method
- Request/response interceptors
- Error handling
- Base URL and headers

### Response Formatting

The \`utils/response.js\` module formats responses for the MCP protocol. You can customize the formatting logic here.

## Troubleshooting

### Authentication Issues

1. Ensure your API token is set correctly
2. Check if the token has required permissions
3. Verify the API base URL is correct

### Connection Issues

1. Check that Node.js version is 18+ (required for ES6 modules)
2. Verify all dependencies are installed
3. Check the logs for detailed error information

## Generated Information

- **Generated**: {{generatedDate}}
- **Generator**: openapi-generator-cli (nodejs-mcp-server ES6 template)
- **OpenAPI Version**: {{openAPIVersion}}
- **Package Version**: {{appVersion}}

## License

{{licenseName}}
`,

      'envExample.mustache': `# {{appName}} Environment Configuration

# API Configuration
API_TOKEN=your_api_token_here
API_BASE_URL={{basePath}}{{^basePath}}https://api.example.com{{/basePath}}

# Logging
LOG_LEVEL=info
NODE_ENV=development

# MCP Server Configuration
MCP_SERVER_NAME={{packageName}}
MCP_SERVER_VERSION={{appVersion}}
`,

      'serverTest.mustache': `/**
 * Tests for {{appName}} MCP Server
 */

import { expect } from 'chai';
import sinon from 'sinon';

describe('{{appName}} MCP Server', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should initialize correctly', () => {
    expect(true).to.be.true;
  });

  describe('Tools', () => {
{{#operations}}
{{#operation}}
    it('should handle {{operationIdCamelCase}}', async () => {
      // TODO: Test {{operationIdCamelCase}} implementation
    });
{{/operation}}
{{/operations}}
  });

  describe('API Client', () => {
    it('should handle authentication', () => {
      // TODO: Test API authentication
    });

    it('should format requests correctly', () => {
      // TODO: Test request formatting
    });
  });

  describe('Response Formatting', () => {
    it('should format success responses', () => {
      // TODO: Test success response formatting
    });

    it('should format error responses', () => {
      // TODO: Test error response formatting
    });
  });
});
`
    };
  }

  installTemplate() {
    console.log('📦 Installing ES6 MCP template files...');
    
    const templates = this.getTemplateFiles();
    
    for (const [filename, content] of Object.entries(templates)) {
      const filePath = path.join(this.templateDir, filename);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Created: ${filename}`);
    }
  }

  createUsageExample() {
    const exampleScript = `#!/bin/bash
# Generate ES6 MCP server with automatic tool registration

echo "🚀 Generating ES6 MCP server from OpenAPI specification..."

openapi-generator-cli generate \\
  -g nodejs-express-server \\
  -t ~/.openapi-generator/templates/nodejs-mcp-server \\
  -i your-openapi-spec.yaml \\
  -o ./generated-mcp-server \\
  --additional-properties=packageName=my-mcp-server,licenseName=MIT \\
  --verbose

echo "✅ MCP server generated!"
echo ""
echo "📋 Next steps:"
echo "1. cd generated-mcp-server"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. Edit .env with your API token"
echo "5. npm start -- --token YOUR_TOKEN"
echo ""
echo "🔧 For Claude Desktop integration:"
echo "Add to claude_desktop_config.json with absolute path and API_TOKEN env var"
`;

    const examplePath = path.join(this.templateDir, 'generate-example.sh');
    fs.writeFileSync(examplePath, exampleScript);
    fs.chmodSync(examplePath, '755');
    console.log(`✅ Created usage example: ${examplePath}`);
  }

  checkGeneratorCli() {
    const { execSync } = require('child_process');
    
    try {
      execSync('openapi-generator-cli version', { stdio: 'ignore' });
      console.log('✅ openapi-generator-cli is installed');
      return true;
    } catch (error) {
      console.log('❌ openapi-generator-cli not found');
      console.log('Install with: npm install @openapitools/openapi-generator-cli -g');
      return false;
    }
  }

  install() {
    console.log('🚀 Installing ES6 MCP Server Template with Auto-Generated Tools...\n');

    this.checkGeneratorCli();
    this.createDirectories();
    this.installTemplate();
    this.createUsageExample();

    console.log('\n✅ Installation complete!');
    console.log(`📁 Template installed at: ${this.templateDir}`);
    console.log('\n🎯 Key Features:');
    console.log('- ES6 modules (import/export)');
    console.log('- Auto-generated tools from OpenAPI operations');
    console.log('- Built-in API client with authentication');
    console.log('- Response formatting utilities');
    console.log('- Modern MCP SDK usage (registerTool)');
    console.log('\n📋 Usage:');
    console.log('openapi-generator-cli generate -g nodejs-express-server -t ~/.openapi-generator/templates/nodejs-mcp-server -i spec.yaml -o ./my-server');
  }

  uninstall() {
    if (fs.existsSync(this.templateDir)) {
      fs.rmSync(this.templateDir, { recursive: true, force: true });
      console.log(`✅ Template removed from: ${this.templateDir}`);
    } else {
      console.log('❌ Template not found');
    }
  }

  list() {
    const templatesDir = path.join(this.homeDir, '.openapi-generator', 'templates');
    
    if (!fs.existsSync(templatesDir)) {
      console.log('❌ No templates directory found');
      return;
    }

    const templates = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('📋 Installed templates:');
    templates.forEach(template => {
      const isMcp = template === 'nodejs-mcp-server' ? ' (ES6 MCP Server with Auto Tools)' : '';
      console.log(`  - ${template}${isMcp}`);
    });
  }

  update() {
    console.log('🔄 Updating template with ES6 and auto-tools features...');
    this.installTemplate();
    console.log('✅ Template updated successfully!');
  }
}

// CLI interface
function main() {
  const installer = new ES6MCPTemplateInstaller();
  const command = process.argv[2];

  switch (command) {
    case 'install':
      installer.install();
      break;
    case 'update':
      installer.update();
      break;
    case 'uninstall':
      installer.uninstall();
      break;
    case 'list':
      installer.list();
      break;
    default:
      console.log(`
🔧 ES6 MCP Template Installer with Auto-Generated Tools

Usage:
  node install-mcp-template.js <command>

Commands:
  install     Install the ES6 MCP server template
  update      Update existing template
  uninstall   Remove the template
  list        List all installed templates

Features:
- ✅ ES6 modules (import/export)
- ✅ Auto-generated tools from OpenAPI operations  
- ✅ Built-in API client with token authentication
- ✅ Response formatting utilities
- ✅ Modern MCP SDK (registerTool pattern)
- ✅ Comprehensive project structure

Generate servers with:
  openapi-generator-cli generate -g nodejs-express-server -t ~/.openapi-generator/templates/nodejs-mcp-server -i spec.yaml -o ./my-server
      `);
  }
}

if (require.main === module) {
  main();
}

module.exports = ES6MCPTemplateInstaller;

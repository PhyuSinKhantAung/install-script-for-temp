#!/usr/bin/env node
/**
 * Modified Express Template for MCP
 * Modifies existing nodejs-express templates to generate MCP servers
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

class ModifiedExpressInstaller {
  constructor() {
    this.homeDir = os.homedir();
    this.templateDir = path.join(
      this.homeDir,
      ".openapi-generator",
      "templates",
      "nodejs-mcp-server"
    );
  }

  createDirectories() {
    const dirs = [
      path.join(this.homeDir, ".openapi-generator"),
      path.join(this.homeDir, ".openapi-generator", "templates"),
      this.templateDir,
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  getTemplateFiles() {
    return {
      // Main configuration - modify the base generator
      "config.yaml": `# Modified nodejs-express template for MCP
generatorName: nodejs-mcp-server
helpTxt: "Generates MCP server by modifying nodejs-express templates"

# Use existing template structure but modify key files
modelTemplateFiles: {}
apiTemplateFiles: {}

# Key files to override
files:
  index.js: index.mustache
  package.json: package.mustache

# Override existing supporting files
supportingFiles:
  - templateFile: "expressServer.mustache"
    destinationFile: "expressServer.js"
  - templateFile: "Controller.mustache" 
    destinationFile: "controllers/Controller.js"
  - templateFile: "Service.mustache"
    destinationFile: "services/Service.js"
  - templateFile: "README.mustache"
    destinationFile: "README.md"
`,

      // Replace index.js completely with MCP server
      "index.mustache": `#!/usr/bin/env node
/**
 * {{appName}} MCP Server
 * {{appDescription}}
 * Generated from OpenAPI specification using modified nodejs-express template
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import winston from 'winston';

// Import all controllers (these will contain our MCP tools)
import controllers from './controllers/index.js';
import { formatResponse } from './services/Service.js';

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mcp-server.log' })
  ]
});

// Initialize MCP Server
const server = new McpServer({
  name: "{{packageName}}",
  version: "{{appVersion}}"
});

// Extract tools from controllers and register them
const tools = [];
for (const controllerName in controllers) {
  const controller = controllers[controllerName];
  if (controller.getMCPTools) {
    const controllerTools = controller.getMCPTools();
    tools.push(...controllerTools);
  }
}

console.log('Found', tools.length, 'tools from controllers');

// Register all MCP tools
for (const tool of tools) {
  server.registerTool(tool.name, tool.schema, tool.handler);
  logger.info('Registered MCP tool: ' + tool.name);
}

const transport = new StdioServerTransport();

async function main() {
  try {
    logger.info("{{appName}} MCP Server is connecting...");
    await server.connect(transport);
    logger.info("{{appName}} MCP Server connected successfully!");
    logger.info("Available tools: " + tools.map(t => t.name).join(', '));
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

      // Modify package.json for MCP dependencies
      "package.mustache": `{
  "name": "{{packageName}}",
  "version": "{{appVersion}}",
  "description": "{{appDescription}} - MCP Server generated from OpenAPI",
  "type": "module",
  "main": "index.js",
  "bin": {
    "{{packageName}}": "./index.js"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "node --inspect index.js",
    "test": "mocha --recursive",
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
    "eslint": "^8.0.0"
  },
  "keywords": ["mcp", "model-context-protocol", "openapi", "{{packageName}}"],
  "license": "{{licenseName}}",
  "engines": {
    "node": ">=18.0.0"
  }
}`,

      // Replace expressServer.js with MCP utilities
      "expressServer.mustache": `/**
 * MCP Utilities (replaces expressServer.js)
 * API Client and utilities for MCP server
 */

import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()]
});

export class ApiClient {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || '{{basePath}}{{^basePath}}https://app.build.io{{/basePath}}';
    this.accessToken = null;
  }

  getAccessToken() {
    if (this.accessToken) return this.accessToken;

    this.accessToken = process.env.API_TOKEN || process.env.ACCESS_TOKEN;
    
    if (!this.accessToken) {
      const tokenIndex = process.argv.indexOf('--token');
      if (tokenIndex !== -1 && process.argv[tokenIndex + 1]) {
        this.accessToken = process.argv[tokenIndex + 1];
      }
    }

    return this.accessToken;
  }

  async request({ method = 'GET', endpoint, queryParams = {}, body = null }) {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token provided. Use --token argument or set API_TOKEN environment variable');
    }

    const url = new URL(endpoint, this.baseUrl);
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'User-Agent': '{{packageName}}/{{appVersion}}'
      }
    };

    if (body && method.toUpperCase() !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    logger.info('API Request: ' + method + ' ' + url.toString());

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error('HTTP ' + response.status + ': ' + errorBody);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }
}

const apiClient = new ApiClient();
export { apiClient };
`,

      // Modify Controller.js to be MCP tool factory
      "Controller.mustache": `/**
 * Base Controller for MCP Tools
 * Converts controller methods to MCP tools
 */

import { formatResponse } from '../services/Service.js';
import { apiClient } from '../expressServer.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()]
});

export class Controller {
  constructor(service) {
    this.service = service;
  }

  static sendResponse(res, response) {
    // In MCP context, this just returns the response
    return response;
  }

  static sendError(res, error) {
    // In MCP context, return error response
    return formatResponse({
      type: "error", 
      message: error.message || 'Operation failed'
    });
  }

  static collectRequestParams(request) {
    // In MCP context, extract parameters from args
    return {
      query: request.query || {},
      params: request.params || {},
      body: request.body || {}
    };
  }

  // Helper method to create MCP tool from controller method
  static createMCPTool(name, schema, handlerFn) {
    return {
      name: name,
      schema: schema,
      handler: handlerFn
    };
  }
}

export default Controller;
`,

      // Modify Service.js to include MCP response formatting
      "Service.mustache": `/**
 * Base Service with MCP Response Formatting
 */

export class Service {
  static rejectResponse(error, code = 500) {
    return {
      error: true,
      code: code,
      message: error.message || error
    };
  }

  static successResponse(payload, code = 200) {
    return {
      success: true,
      code: code,
      payload: payload
    };
  }
}

// MCP Response formatter
export function formatResponse({ type = "success", message = "", data = null }) {
  const response = { content: [] };

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

export default Service;
`,
    };
  }

  // Now we need to create controller and service templates that generate from OpenAPI operations
  getControllerTemplate() {
    return `/**
 * {{classname}} Controller
 * Generated from OpenAPI operations
 */

import Controller from './Controller.js';
import {{classname}}Service from '../services/{{classname}}Service.js';

export class {{classname}}Controller {
  constructor() {
    this.service = {{classname}}Service;
  }

  /**
   * Get MCP tools for this controller
   * Converts OpenAPI operations to MCP tools
   */
  getMCPTools() {
    const tools = [];
    
{{#operations}}
{{#operation}}
    // {{summary}} - {{httpMethod}} {{path}}
    tools.push(Controller.createMCPTool(
      "{{operationId}}",
      {
        title: "{{summary}}",
        description: "{{summary}}{{#notes}} - {{notes}}{{/notes}}",
        properties: {
{{#allParams}}
          {{paramName}}: {
            type: "{{#isString}}string{{/isString}}{{#isInteger}}integer{{/isInteger}}{{#isLong}}integer{{/isLong}}{{#isFloat}}number{{/isFloat}}{{#isDouble}}number{{/isDouble}}{{#isBoolean}}boolean{{/isBoolean}}{{#isArray}}array{{/isArray}}{{#isObject}}object{{/isObject}}{{^isPrimitiveType}}string{{/isPrimitiveType}}",
            description: "{{description}}"
          }{{#hasMore}},{{/hasMore}}
{{/allParams}}
        },
        required: [{{#requiredParams}}"{{paramName}}"{{#hasMore}}, {{/hasMore}}{{/requiredParams}}]
      },
      async (args) => {
        try {
          const result = await this.service.{{operationId}}(args);
          return result;
        } catch (error) {
          return Controller.sendError(null, error);
        }
      }
    ));

{{/operation}}
{{/operations}}
    
    return tools;
  }
}

export default new {{classname}}Controller();
`;
  }

  getServiceTemplate() {
    return `/**
 * {{classname}} Service
 * Generated from OpenAPI operations - contains actual API logic
 */

import { Service, formatResponse } from './Service.js';
import { apiClient } from '../expressServer.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()]
});

export class {{classname}}Service {
{{#operations}}
{{#operation}}

  /**
   * {{summary}}
   * {{notes}}
   * {{httpMethod}} {{path}}
   */
  static async {{operationId}}(args) {
    try {
      let endpoint = "{{path}}";
      const queryParams = {};
      const bodyData = {};

      // Handle path parameters
{{#allParams}}
{{#isPathParam}}
      if (args.{{paramName}}) {
        endpoint = endpoint.replace('{{{paramName}}}', encodeURIComponent(args.{{paramName}}));
      }
{{/isPathParam}}
{{#isQueryParam}}
      if (args.{{paramName}} !== undefined) {
        queryParams['{{paramName}}'] = args.{{paramName}};
      }
{{/isQueryParam}}
{{#isBodyParam}}
      if (args.{{paramName}} !== undefined) {
        bodyData['{{paramName}}'] = args.{{paramName}};
      }
{{/isBodyParam}}
{{/allParams}}

      // Make API request
      const requestOptions = {
        method: '{{httpMethod}}',
        endpoint: endpoint
      };

      if (Object.keys(queryParams).length > 0) {
        requestOptions.queryParams = queryParams;
      }

      if (Object.keys(bodyData).length > 0) {
        requestOptions.body = bodyData;
      }

      const response = await apiClient.request(requestOptions);

      return formatResponse({
        message: "{{summary}} completed successfully",
        data: response
      });

    } catch (error) {
      logger.error('Error in {{operationId}}:', error);
      return formatResponse({
        type: "error",
        message: "{{summary}} failed: " + (error.message || JSON.stringify(error))
      });
    }
  }
{{/operation}}
{{/operations}}
}

export default {{classname}}Service;
`;
  }

  installTemplate() {
    console.log("📦 Installing modified express templates for MCP...");

    const templates = this.getTemplateFiles();

    // Install base templates
    for (const [filename, content] of Object.entries(templates)) {
      const filePath = path.join(this.templateDir, filename);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Created: ${filename}`);
    }

    // Install controller template
    const controllerPath = path.join(this.templateDir, "controller.mustache");
    fs.writeFileSync(controllerPath, this.getControllerTemplate());
    console.log(`✅ Created: controller.mustache`);

    // Install service template
    const servicePath = path.join(this.templateDir, "service.mustache");
    fs.writeFileSync(servicePath, this.getServiceTemplate());
    console.log(`✅ Created: service.mustache`);
  }

  createReadme() {
    const readme = `# Modified Express Template for MCP

This template modifies the nodejs-express-server generator to create MCP servers instead of Express servers.

## How it works:

1. **Controllers** → **MCP Tools**: Each OpenAPI operation becomes an MCP tool
2. **Services** → **API Logic**: Services contain the actual API calling logic
3. **index.js** → **MCP Server**: Main file registers all tools from controllers

## Usage:

\`\`\`bash
openapi-generator-cli generate \\
  -g nodejs-express-server \\
  -t ~/.openapi-generator/templates/nodejs-mcp-server \\
  -i your-openapi-spec.yaml \\
  -o ./generated-mcp-server \\
  --additional-properties=packageName=my-mcp-server
\`\`\`

## Generated Structure:

- **index.js**: MCP server that registers tools from controllers
- **controllers/**: Each API tag becomes a controller with getMCPTools() method
- **services/**: Each controller has a corresponding service with API logic
- **expressServer.js**: Contains API client utilities

## Key Features:

- ✅ Uses openapi-generator's built-in operation parsing
- ✅ Maintains familiar controller/service architecture
- ✅ Automatically generates MCP tools from OpenAPI operations
- ✅ Includes proper API authentication and error handling
- ✅ ES6 modules throughout
`;

    const readmePath = path.join(this.templateDir, "TEMPLATE_README.md");
    fs.writeFileSync(readmePath, readme);
    console.log(`✅ Created: TEMPLATE_README.md`);
  }

  install() {
    console.log("🚀 Installing Modified Express Template for MCP...\n");
    this.createDirectories();
    this.installTemplate();
    this.createReadme();

    console.log("\n✅ Modified express template installed!");
    console.log("\n🔧 This template:");
    console.log("- Modifies existing nodejs-express templates");
    console.log("- Uses openapi-generator operation parsing");
    console.log("- Converts controllers to MCP tool factories");
    console.log("- Converts services to API calling logic");
    console.log("- Replaces Express server with MCP server");
    console.log("\n📋 Generate with:");
    console.log(
      "openapi-generator-cli generate -g nodejs-express-server -t ~/.openapi-generator/templates/nodejs-mcp-server -i build.yaml -o ./mcp-server"
    );
  }
}

const installer = new ModifiedExpressInstaller();
installer.install();

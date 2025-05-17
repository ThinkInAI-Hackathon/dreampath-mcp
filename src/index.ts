#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Environment variables will be provided in the MCP settings
const API_KEY = process.env.DEEPPATH_API_KEY;
const BASE_URL = process.env.DEEPPATH_BASE_URL || 'http://localhost:3000';

if (!API_KEY) {
  throw new Error('DEEPPATH_API_KEY environment variable is required');
}

// Type definitions based on the test script
interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  isMainGoal?: boolean;
  status?: string;
  progress?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

class DeepPathServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'deeppath-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: `${BASE_URL}/api/mcp/standard`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'getProjectInfo',
          description: 'Get information about the current project',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'getTasks',
          description: 'Get a list of tasks',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Filter tasks by status (all, active, completed)',
                enum: ['all', 'active', 'completed']
              },
              limit: {
                type: 'number',
                description: 'Maximum number of tasks to return'
              }
            },
            required: [],
          },
        },
        {
          name: 'getTask',
          description: 'Get details of a specific task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'ID of the task to retrieve'
              }
            },
            required: ['taskId'],
          },
        },
        {
          name: 'createTask',
          description: 'Create a new task',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the task'
              },
              description: {
                type: 'string',
                description: 'Description of the task'
              }
            },
            required: ['title'],
          },
        },
        {
          name: 'updateTask',
          description: 'Update an existing task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'ID of the task to update'
              },
              title: {
                type: 'string',
                description: 'New title for the task'
              },
              description: {
                type: 'string',
                description: 'New description for the task'
              },
              status: {
                type: 'string',
                description: 'New status for the task',
                enum: ['active', 'completed']
              }
            },
            required: ['taskId'],
          },
        },
        {
          name: 'getGoals',
          description: 'Get a list of goals',
          inputSchema: {
            type: 'object',
            properties: {
              includeCompleted: {
                type: 'boolean',
                description: 'Whether to include completed goals'
              }
            },
            required: [],
          },
        },
        {
          name: 'createGoal',
          description: 'Create a new goal',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the goal'
              },
              description: {
                type: 'string',
                description: 'Description of the goal'
              },
              isMainGoal: {
                type: 'boolean',
                description: 'Whether this is a main goal'
              }
            },
            required: ['title'],
          },
        },
        {
          name: 'updateGoal',
          description: 'Update an existing goal',
          inputSchema: {
            type: 'object',
            properties: {
              goalId: {
                type: 'string',
                description: 'ID of the goal to update'
              },
              title: {
                type: 'string',
                description: 'New title for the goal'
              },
              description: {
                type: 'string',
                description: 'New description for the goal'
              },
              status: {
                type: 'string',
                description: 'New status for the goal',
                enum: ['active', 'completed']
              },
              progress: {
                type: 'number',
                description: 'Progress percentage (0-100)'
              }
            },
            required: ['goalId'],
          },
        },
        {
          name: 'getNotes',
          description: 'Get a list of notes',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of notes to return'
              }
            },
            required: [],
          },
        },
        {
          name: 'createNote',
          description: 'Create a new note',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the note'
              },
              content: {
                type: 'string',
                description: 'Content of the note'
              }
            },
            required: ['title', 'content'],
          },
        },
        {
          name: 'updateNote',
          description: 'Update an existing note',
          inputSchema: {
            type: 'object',
            properties: {
              noteId: {
                type: 'string',
                description: 'ID of the note to update'
              },
              title: {
                type: 'string',
                description: 'New title for the note'
              },
              content: {
                type: 'string',
                description: 'New content for the note'
              }
            },
            required: ['noteId'],
          },
        },
        {
          name: 'deleteNote',
          description: 'Delete a note',
          inputSchema: {
            type: 'object',
            properties: {
              noteId: {
                type: 'string',
                description: 'ID of the note to delete'
              }
            },
            required: ['noteId'],
          },
        },
        {
          name: 'deleteTask',
          description: 'Delete a task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'ID of the task to delete'
              }
            },
            required: ['taskId'],
          },
        },
        {
          name: 'deleteGoal',
          description: 'Delete a goal',
          inputSchema: {
            type: 'object',
            properties: {
              goalId: {
                type: 'string',
                description: 'ID of the goal to delete'
              }
            },
            required: ['goalId'],
          },
        },
        {
          name: 'getIcsLink',
          description: 'Get ICS calendar link for the project',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'getAutomations',
          description: 'Get a list of automation rules',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Call the DeepPath API using the functionCall format
        const response = await this.axiosInstance.post('', {
          functionCall: {
            name: request.params.name,
            parameters: request.params.arguments
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `DeepPath API error: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DeepPath MCP server running on stdio');
  }
}

const server = new DeepPathServer();
server.run().catch(console.error);

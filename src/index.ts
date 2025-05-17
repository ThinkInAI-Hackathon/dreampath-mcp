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
  projectId: string;
  title: string;
  description?: string;
  dueAt?: string;
  isRepeating?: boolean;
  repeatPattern?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  isAllDay?: boolean;
  startTime: string;
  endTime: string;
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
          description: 'Get information about the current project. Use this when you need basic project details like name, ID, or general information to provide context.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'getTasks',
          description: 'Get a list of tasks from the project. Use this when the user asks about their tasks, to-do items, or when you need to show task status or overview information.',
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
          description: 'Get details of a specific task. Use this when the user asks about a particular task by ID or when you need comprehensive information about one specific task.',
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
          description: 'Create a new task. Call this when the user asks to add, create, or set up a new task or to-do item.',
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
          description: 'Update an existing task. Use this when the user wants to modify, change, edit, or mark a task as complete.',
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
          description: 'Get a list of goals. Use this when the user asks about their goals, objectives, targets, or when discussing project progress and planning.',
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
          description: 'Create a new goal. Call this when the user wants to set, create, or establish a new goal, objective, or milestone.',
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
          description: 'Update an existing goal. Use this when the user wants to modify, adjust, edit, or change the status or progress of a goal.',
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
          description: 'Get a list of notes. Use this when the user asks about their notes, memos, or written information they\'ve saved.',
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
          description: 'Create a new note. Call this when the user wants to jot down, write, save, or create a new note, memo, or written record.',
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
          description: 'Update an existing note. Use this when the user wants to edit, modify, or change the content or title of a note they\'ve already created.',
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
          description: 'Delete a note. Call this when the user wants to remove, delete, or get rid of a specific note.',
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
          description: 'Delete a task. Use this when the user wants to remove, delete, or get rid of a specific task.',
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
          description: 'Delete a goal. Call this when the user wants to remove, delete, or abandon a specific goal.',
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
          description: 'Get ICS calendar link for the project. Use this when the user wants to export or connect their calendar to external calendar applications.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'getAutomations',
          description: 'Get a list of automation rules. Use this when the user asks about automated processes, rules, recurring tasks, or workflow automations.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'createAutomation',
          description: 'Create a new automation rule. Call this when the user wants to set up, create, or establish a new automated process or recurring task.',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the automation rule'
              },
              description: {
                type: 'string',
                description: 'Description of the automation rule'
              },
              dueDateTime: {
                type: 'string',
                description: 'Due date and time in ISO format'
              },
              isRepeating: {
                type: 'boolean',
                description: 'Whether the automation is repeating'
              },
              repeatPattern: {
                type: 'string',
                description: 'Pattern for repeating (e.g., daily, weekly, monthly)',
                enum: ['daily', 'weekly', 'monthly']
              },
              actionType: {
                type: 'string',
                description: 'Type of action for this automation',
                enum: ['notification', 'email', 'webhook']
              }
            },
            required: ['title'],
          },
        },
        {
          name: 'updateAutomation',
          description: 'Update an existing automation rule. Use this when the user wants to modify, change, or edit the settings for an existing automation or recurring task.',
          inputSchema: {
            type: 'object',
            properties: {
              automationId: {
                type: 'string',
                description: 'ID of the automation rule to update'
              },
              title: {
                type: 'string',
                description: 'New title for the automation rule'
              },
              description: {
                type: 'string',
                description: 'New description for the automation rule'
              },
              isRepeating: {
                type: 'boolean',
                description: 'Whether the automation is repeating'
              },
              repeatPattern: {
                type: 'string',
                description: 'New pattern for repeating',
                enum: ['daily', 'weekly', 'monthly']
              }
            },
            required: ['automationId'],
          },
        },
        {
          name: 'deleteAutomation',
          description: 'Delete an automation rule. Call this when the user wants to remove, delete, or cancel an automation or recurring task.',
          inputSchema: {
            type: 'object',
            properties: {
              automationId: {
                type: 'string',
                description: 'ID of the automation rule to delete'
              }
            },
            required: ['automationId'],
          },
        },
        {
          name: 'getCalendarEvents',
          description: 'Get a list of calendar events within a date range. Use this when the user asks about their schedule, calendar, events, meetings, or appointments.',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in ISO format'
              },
              endDate: {
                type: 'string',
                description: 'End date in ISO format'
              }
            },
            required: [],
          },
        },
        {
          name: 'createCalendarEvent',
          description: 'Create a new calendar event. IMPORTANT: Call this whenever the user mentions any meeting, appointment, event, or schedule with a specific time or date. Always create calendar events when time-specific activities are discussed, even if not explicitly requested.',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the calendar event'
              },
              description: {
                type: 'string',
                description: 'Description of the calendar event'
              },
              startTime: {
                type: 'string',
                description: 'Start time in ISO format'
              },
              endTime: {
                type: 'string',
                description: 'End time in ISO format'
              },
              location: {
                type: 'string',
                description: 'Location of the event'
              },
              isAllDay: {
                type: 'boolean',
                description: 'Whether the event is an all-day event'
              }
            },
            required: ['title', 'startTime', 'endTime'],
          },
        },
        {
          name: 'updateCalendarEvent',
          description: 'Update an existing calendar event. Use this when the user wants to modify, reschedule, or change details of an existing meeting, appointment, or event.',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'ID of the calendar event to update'
              },
              title: {
                type: 'string',
                description: 'New title for the calendar event'
              },
              description: {
                type: 'string',
                description: 'New description for the calendar event'
              },
              startTime: {
                type: 'string',
                description: 'New start time in ISO format'
              },
              endTime: {
                type: 'string',
                description: 'New end time in ISO format'
              },
              location: {
                type: 'string',
                description: 'New location of the event'
              },
              isAllDay: {
                type: 'boolean',
                description: 'Whether the event is an all-day event'
              }
            },
            required: ['eventId'],
          },
        },
        {
          name: 'deleteCalendarEvent',
          description: 'Delete a calendar event. Call this when the user wants to cancel, remove, or delete a specific meeting, appointment, or calendar event.',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'ID of the calendar event to delete'
              }
            },
            required: ['eventId'],
          },
        },
        {
          name: 'toggleLamp',
          description: 'Control the status of a desk lamp. Use this when the user wants to turn on or off their desk lamp or control their smart home devices.',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Status to set the lamp to (on/off)',
                enum: ['on', 'off']
              }
            },
            required: ['status'],
          },
        },
        {
          name: 'getCurrentDateTime',
          description: 'Get the current date and time. Use this when the user asks about the current time, current date, or needs to know the present time/date for scheduling or reference.',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                description: 'Optional format for the date/time (e.g., "iso", "simple", "full")',
                enum: ['iso', 'simple', 'full']
              }
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Handle getCurrentDateTime locally
        if (request.params.name === 'getCurrentDateTime') {
          const now = new Date();
          const format = request.params.arguments?.format || 'iso';
          
          let formattedDateTime;
          switch (format) {
            case 'iso':
              formattedDateTime = now.toISOString();
              break;
            case 'simple':
              formattedDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
              break;
            case 'full':
              formattedDateTime = now.toLocaleString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
              });
              break;
            default:
              formattedDateTime = now.toISOString();
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  datetime: formattedDateTime,
                  timestamp: now.getTime() 
                }, null, 2),
              },
            ],
          };
        }

        // Call the DeepPath API for all other functions
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

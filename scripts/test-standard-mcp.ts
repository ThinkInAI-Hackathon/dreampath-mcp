/**
 * DeepPath 标准MCP API测试脚本
 * 
 * 用法: 
 * 1. 首先获取项目API密钥: 在DeepPath项目设置页面创建API密钥
 * 2. 运行: npx tsx scripts/test-standard-mcp.ts --api-key=dp_your_api_key_here [--url=http://localhost:3000]
 */

import fetch from 'node-fetch';
import { parseArgs } from 'node:util';
import chalk from 'chalk';

// 解析命令行参数
const options = {
  'api-key': { type: 'string' as const, short: 'k' },
  'url': { type: 'string' as const, short: 'u', default: 'http://localhost:3000' }
};

const { values } = parseArgs({ options });
const apiKey = values['api-key'] as string | undefined;
const baseUrl = values['url'] as string;

if (!apiKey) {
  console.error(chalk.red('错误: 未提供API密钥'));
  console.log('用法: npx tsx scripts/test-standard-mcp.ts --api-key=dp_your_api_key_here [--url=http://localhost:3000]');
  process.exit(1);
}

// 明确声明apiKey非空
const actualApiKey: string = apiKey;

const standardMcpUrl = `${baseUrl}/api/mcp/standard`;

interface FunctionParameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
}

interface Function {
  name: string;
  description: string;
  parameters: FunctionParameter[];
}

// 定义数据类型
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

// 添加自动化规则接口定义
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

// 添加日历事件接口定义
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

// 修改测试表，添加实际创建和验证操作
const tests = [
  {
    name: '获取可用函数列表',
    run: async () => await getFunctions()
  },
  {
    name: '获取项目信息',
    run: async () => await callFunction('getProjectInfo', {})
  },
  {
    name: '获取任务列表',
    run: async () => await callFunction('getTasks', { status: 'all', limit: 10 })
  },
  {
    name: '获取目标列表',
    run: async () => await callFunction('getGoals', { includeCompleted: false })
  },
  {
    name: '获取笔记列表',
    run: async () => await callFunction('getNotes', { limit: 10 })
  },
  {
    name: '获取自动化规则',
    run: async () => await callFunction('getAutomations', {})
  },
  {
    name: '创建/更新/删除任务完整流程',
    run: async () => {
      // 生成唯一标题避免重复
      const uniqueTitle = `测试任务 ${new Date().toISOString()}`;
      
      // 1. 创建任务
      console.log(chalk.yellow('1. 创建任务...'));
      const createResult = await callFunction('createTask', { 
        title: uniqueTitle, 
        description: '这是一个通过API创建的测试任务'
      });
      console.log(chalk.green('任务创建结果:'), JSON.stringify(createResult, null, 2));
      
      if (!createResult.success || !createResult.data?.id) {
        throw new Error('创建任务失败');
      }
      
      const taskId = createResult.data.id;
      
      // 2. 获取任务详情验证
      console.log(chalk.yellow(`2. 验证任务 ${taskId}...`));
      const getResult = await callFunction('getTask', { taskId });
      console.log(chalk.green('任务获取结果:'), JSON.stringify(getResult, null, 2));
      
      // 3. 验证标题是否匹配
      if (getResult.task?.title !== uniqueTitle) {
        throw new Error(`创建的任务标题不匹配: 期望 "${uniqueTitle}", 实际 "${getResult.task?.title}"`);
      }
      
      // 4. 更新任务
      console.log(chalk.yellow(`3. 更新任务 ${taskId}...`));
      const updatedTitle = `${uniqueTitle} [已更新]`;
      const updateResult = await callFunction('updateTask', { 
        taskId, 
        title: updatedTitle,
        description: '这是通过API更新的任务描述'
      });
      console.log(chalk.green('任务更新结果:'), JSON.stringify(updateResult, null, 2));
      
      // 5. 验证更新是否成功
      console.log(chalk.yellow(`4. 验证更新后的任务 ${taskId}...`));
      const getUpdatedResult = await callFunction('getTask', { taskId });
      
      if (getUpdatedResult.task?.title !== updatedTitle) {
        throw new Error(`更新后的任务标题不匹配: 期望 "${updatedTitle}", 实际 "${getUpdatedResult.task?.title}"`);
      }
      
      // 6. 删除任务
      console.log(chalk.yellow(`5. 删除任务 ${taskId}...`));
      const deleteResult = await callFunction('deleteTask', { taskId });
      console.log(chalk.green('任务删除结果:'), JSON.stringify(deleteResult, null, 2));
      
      // 7. 验证删除是否成功
      console.log(chalk.yellow(`6. 验证任务 ${taskId} 是否已删除...`));
      try {
        await callFunction('getTask', { taskId });
        throw new Error('任务删除失败，仍能获取到任务');
      } catch {
        // 预期会有错误，因为任务已删除
        console.log(chalk.green('任务已成功删除'));
      }
      
      return { 
        createResult, 
        getResult, 
        updateResult, 
        deleteResult, 
        verified: true 
      };
    }
  },
  {
    name: '创建/更新/删除目标完整流程',
    run: async () => {
      // 生成唯一标题避免重复
      const uniqueTitle = `测试目标 ${new Date().toISOString()}`;
      
      // 1. 创建目标
      console.log(chalk.yellow('1. 创建目标...'));
      const createResult = await callFunction('createGoal', { 
        title: uniqueTitle, 
        description: '这是一个通过API创建的测试目标',
        isMainGoal: false
      });
      console.log(chalk.green('目标创建结果:'), JSON.stringify(createResult, null, 2));
      
      if (!createResult.success || !createResult.data?.id) {
        throw new Error('创建目标失败');
      }
      
      const goalId = createResult.data.id;
      
      // 2. 获取目标列表验证
      console.log(chalk.yellow('2. 验证目标是否在列表中...'));
      const getResult = await callFunction('getGoals', { includeCompleted: false });
      
      // 3. 验证是否包含创建的目标
      const foundGoal = getResult.goals?.find((goal: Goal) => goal.title === uniqueTitle);
      if (!foundGoal) {
        throw new Error(`在目标列表中未找到创建的目标: ${uniqueTitle}`);
      }
      
      // 4. 更新目标
      console.log(chalk.yellow(`3. 更新目标 ${goalId}...`));
      const updatedTitle = `${uniqueTitle} [已更新]`;
      const updateResult = await callFunction('updateGoal', {
        goalId,
        title: updatedTitle,
        description: '这是通过API更新的目标描述',
        progress: 50
      });
      console.log(chalk.green('目标更新结果:'), JSON.stringify(updateResult, null, 2));
      
      // 5. 验证更新是否成功
      console.log(chalk.yellow('4. 验证目标更新是否成功...'));
      const getUpdatedResult = await callFunction('getGoals', { includeCompleted: false });
      const updatedGoal = getUpdatedResult.goals?.find((goal: Goal) => goal.id === goalId);
      
      if (!updatedGoal || updatedGoal.title !== updatedTitle) {
        throw new Error(`更新后的目标标题不匹配: 期望 "${updatedTitle}", 实际 "${updatedGoal?.title}"`);
      }
      
      // 6. 删除目标
      console.log(chalk.yellow(`5. 删除目标 ${goalId}...`));
      const deleteResult = await callFunction('deleteGoal', { goalId });
      console.log(chalk.green('目标删除结果:'), JSON.stringify(deleteResult, null, 2));
      
      // 7. 验证删除是否成功
      console.log(chalk.yellow('6. 验证目标是否已删除...'));
      const getDeletedResult = await callFunction('getGoals', { includeCompleted: false });
      const deletedGoal = getDeletedResult.goals?.find((goal: Goal) => goal.id === goalId);
      
      if (deletedGoal) {
        throw new Error('目标删除失败，仍能获取到目标');
      }
      
      return { 
        createResult, 
        getResult, 
        updateResult, 
        deleteResult, 
        verified: true 
      };
    }
  },
  {
    name: '创建/更新/删除笔记完整流程',
    run: async () => {
      // 生成唯一标题避免重复
      const uniqueTitle = `测试笔记 ${new Date().toISOString()}`;
      
      // 1. 创建笔记
      console.log(chalk.yellow('1. 创建笔记...'));
      const createResult = await callFunction('createNote', { 
        title: uniqueTitle, 
        content: '这是一个通过API创建的测试笔记内容'
      });
      console.log(chalk.green('笔记创建结果:'), JSON.stringify(createResult, null, 2));
      
      if (!createResult.success || !createResult.data?.id) {
        throw new Error('创建笔记失败');
      }
      
      const noteId = createResult.data.id;
      
      // 2. 获取笔记列表验证
      console.log(chalk.yellow('2. 验证笔记是否在列表中...'));
      const getResult = await callFunction('getNotes', { limit: 10 });
      
      // 3. 验证是否包含创建的笔记
      const foundNote = getResult.notes?.find((note: Note) => note.title === uniqueTitle);
      if (!foundNote) {
        throw new Error(`在笔记列表中未找到创建的笔记: ${uniqueTitle}`);
      }
      
      // 4. 更新笔记
      console.log(chalk.yellow(`3. 更新笔记 ${noteId}...`));
      const updatedTitle = `${uniqueTitle} [已更新]`;
      const updateResult = await callFunction('updateNote', {
        noteId,
        title: updatedTitle,
        content: '这是通过API更新的笔记内容'
      });
      console.log(chalk.green('笔记更新结果:'), JSON.stringify(updateResult, null, 2));
      
      // 5. 验证更新是否成功
      console.log(chalk.yellow('4. 验证笔记更新是否成功...'));
      const getUpdatedResult = await callFunction('getNotes', { limit: 10 });
      const updatedNote = getUpdatedResult.notes?.find((note: Note) => note.id === noteId);
      
      if (!updatedNote || updatedNote.title !== updatedTitle) {
        throw new Error(`更新后的笔记标题不匹配: 期望 "${updatedTitle}", 实际 "${updatedNote?.title}"`);
      }
      
      // 6. 删除笔记
      console.log(chalk.yellow(`5. 删除笔记 ${noteId}...`));
      const deleteResult = await callFunction('deleteNote', { noteId });
      console.log(chalk.green('笔记删除结果:'), JSON.stringify(deleteResult, null, 2));
      
      // 7. 验证删除是否成功
      console.log(chalk.yellow('6. 验证笔记是否已删除...'));
      const getDeletedResult = await callFunction('getNotes', { limit: 10 });
      const deletedNote = getDeletedResult.notes?.find((note: Note) => note.id === noteId);
      
      if (deletedNote) {
        throw new Error('笔记删除失败，仍能获取到笔记');
      }
      
      return { 
        createResult, 
        getResult, 
        updateResult, 
        deleteResult, 
        verified: true 
      };
    }
  },
  {
    name: '创建/更新/删除自动化规则完整流程',
    run: async () => {
      // 生成唯一标题避免重复
      const uniqueTitle = `测试自动化规则 ${new Date().toISOString()}`;
      
      // 1. 创建自动化规则
      console.log(chalk.yellow('1. 创建自动化规则...'));
      const createResult = await callFunction('createAutomation', { 
        title: uniqueTitle, 
        description: '这是一个通过API创建的测试自动化规则',
        dueDateTime: new Date(Date.now() + 86400000).toISOString(), // 明天
        isRepeating: true,
        repeatPattern: 'weekly',
        actionType: 'notification'
      });
      console.log(chalk.green('自动化规则创建结果:'), JSON.stringify(createResult, null, 2));
      
      if (!createResult.success || !createResult.data?.id) {
        throw new Error('创建自动化规则失败');
      }
      
      const automationId = createResult.data.id;
      
      // 2. 获取自动化规则列表验证
      console.log(chalk.yellow('2. 验证自动化规则是否在列表中...'));
      const getResult = await callFunction('getAutomations', {});
      
      // 3. 验证是否包含创建的自动化规则
      const foundAutomation = getResult.automations?.find((automation: Automation) => automation.title === uniqueTitle);
      if (!foundAutomation) {
        throw new Error(`在自动化规则列表中未找到创建的规则: ${uniqueTitle}`);
      }
      
      // 4. 更新自动化规则
      console.log(chalk.yellow(`3. 更新自动化规则 ${automationId}...`));
      const updatedTitle = `${uniqueTitle} [已更新]`;
      const updateResult = await callFunction('updateAutomation', {
        automationId,
        title: updatedTitle,
        description: '这是通过API更新的自动化规则描述',
        isRepeating: false
      });
      console.log(chalk.green('自动化规则更新结果:'), JSON.stringify(updateResult, null, 2));
      
      // 5. 验证更新是否成功
      console.log(chalk.yellow('4. 验证自动化规则更新是否成功...'));
      const getUpdatedResult = await callFunction('getAutomations', {});
      const updatedAutomation = getUpdatedResult.automations?.find((automation: Automation) => automation.id === automationId);
      
      if (!updatedAutomation || updatedAutomation.title !== updatedTitle) {
        throw new Error(`更新后的自动化规则标题不匹配: 期望 "${updatedTitle}", 实际 "${updatedAutomation?.title}"`);
      }
      
      // 6. 删除自动化规则
      console.log(chalk.yellow(`5. 删除自动化规则 ${automationId}...`));
      const deleteResult = await callFunction('deleteAutomation', { automationId });
      console.log(chalk.green('自动化规则删除结果:'), JSON.stringify(deleteResult, null, 2));
      
      // 7. 验证删除是否成功
      console.log(chalk.yellow('6. 验证自动化规则是否已删除...'));
      const getDeletedResult = await callFunction('getAutomations', {});
      const deletedAutomation = getDeletedResult.automations?.find((automation: Automation) => automation.id === automationId);
      
      if (deletedAutomation) {
        throw new Error('自动化规则删除失败，仍能获取到规则');
      }
      
      return { 
        createResult, 
        getResult, 
        updateResult, 
        deleteResult, 
        verified: true 
      };
    }
  },
  {
    name: '创建/更新/删除日历事件完整流程',
    run: async () => {
      // 生成唯一标题避免重复
      const uniqueTitle = `测试日历事件 ${new Date().toISOString()}`;
      
      // 计算开始和结束时间
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);
      
      // 1. 创建日历事件
      console.log(chalk.yellow('1. 创建日历事件...'));
      const createResult = await callFunction('createCalendarEvent', { 
        title: uniqueTitle, 
        description: '这是一个通过API创建的测试日历事件',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: '线上会议',
        isAllDay: false
      });
      console.log(chalk.green('日历事件创建结果:'), JSON.stringify(createResult, null, 2));
      
      if (!createResult.success || !createResult.data?.id) {
        throw new Error('创建日历事件失败');
      }
      
      const eventId = createResult.data.id;
      
      // 2. 获取日历事件列表验证
      console.log(chalk.yellow('2. 验证日历事件是否在列表中...'));
      // 获取当天和明天的日期范围
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const getResult = await callFunction('getCalendarEvents', { 
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      });
      
      // 3. 验证是否包含创建的日历事件
      const foundEvent = getResult.events?.find((event: CalendarEvent) => event.title === uniqueTitle);
      if (!foundEvent) {
        throw new Error(`在日历事件列表中未找到创建的事件: ${uniqueTitle}`);
      }
      
      // 4. 更新日历事件
      console.log(chalk.yellow(`3. 更新日历事件 ${eventId}...`));
      const updatedTitle = `${uniqueTitle} [已更新]`;
      const updateResult = await callFunction('updateCalendarEvent', {
        eventId,
        title: updatedTitle,
        description: '这是通过API更新的日历事件描述',
        location: '办公室会议室'
      });
      console.log(chalk.green('日历事件更新结果:'), JSON.stringify(updateResult, null, 2));
      
      // 5. 验证更新是否成功
      console.log(chalk.yellow('4. 验证日历事件更新是否成功...'));
      const getUpdatedResult = await callFunction('getCalendarEvents', {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      });
      const updatedEvent = getUpdatedResult.events?.find((event: CalendarEvent) => event.id === eventId);
      
      if (!updatedEvent || updatedEvent.title !== updatedTitle) {
        throw new Error(`更新后的日历事件标题不匹配: 期望 "${updatedTitle}", 实际 "${updatedEvent?.title}"`);
      }
      
      // 6. 删除日历事件
      console.log(chalk.yellow(`5. 删除日历事件 ${eventId}...`));
      const deleteResult = await callFunction('deleteCalendarEvent', { eventId });
      console.log(chalk.green('日历事件删除结果:'), JSON.stringify(deleteResult, null, 2));
      
      // 7. 验证删除是否成功
      console.log(chalk.yellow('6. 验证日历事件是否已删除...'));
      const getDeletedResult = await callFunction('getCalendarEvents', {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      });
      const deletedEvent = getDeletedResult.events?.find((event: CalendarEvent) => event.id === eventId);
      
      if (deletedEvent) {
        throw new Error('日历事件删除失败，仍能获取到事件');
      }
      
      return { 
        createResult, 
        getResult, 
        updateResult, 
        deleteResult, 
        verified: true 
      };
    }
  },
  {
    name: '获取ICS链接',
    run: async () => await callFunction('getIcsLink', {})
  }
];

// 获取可用函数列表
async function getFunctions(): Promise<Function[]> {
  try {
    const response = await fetch(standardMcpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${actualApiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json() as { functions: Function[] };
    return data.functions;
  } catch (error) {
    console.error('获取函数列表失败:', error);
    throw error;
  }
}

// 调用函数
async function callFunction(functionName: string, parameters: Record<string, unknown>) {
  try {
    const response = await fetch(standardMcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualApiKey}`
      },
      body: JSON.stringify({
        functionCall: {
          name: functionName,
          parameters
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`调用函数 ${functionName} 失败:`, error);
    throw error;
  }
}

// 运行所有测试
async function runTests() {
  console.log(chalk.blue('===== DeepPath 标准MCP API测试 ====='));
  console.log(`API URL: ${standardMcpUrl}`);
  console.log(`API Key: ${actualApiKey.substring(0, 8)}...`);
  console.log(chalk.blue('===================================\n'));

  try {
    // 先获取所有可用函数
    const functions = await tests[0].run();
    console.log(chalk.green(`✓ ${tests[0].name}`));
    console.log(`发现 ${functions.length} 个可用函数:`);
    
    functions.forEach((func: Function) => {
      console.log(`  - ${func.name}: ${func.description}`);
    });
    console.log('');

    // 运行剩余测试
    for (let i = 1; i < tests.length; i++) {
      const test = tests[i];
      try {
        console.log(chalk.blue(`测试: ${test.name}`));
        const result = await test.run();
        console.log(chalk.green('✓ 成功'));
        console.log('结果:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log(chalk.red(`✗ 失败: ${error instanceof Error ? error.message : String(error)}`));
      }
      console.log('');
    }

    console.log(chalk.blue('===== 测试完成 ====='));
  } catch (error) {
    console.error(chalk.red('测试过程中发生错误:'));
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('未处理的错误:', error);
  process.exit(1);
}); 
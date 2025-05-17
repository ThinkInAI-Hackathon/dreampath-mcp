/**
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
    name: '创建任务并验证',
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
      
      if (!createResult.success || !createResult.task || !createResult.task.id) {
        throw new Error('创建任务失败');
      }
      
      const taskId = createResult.task.id;
      
      // 2. 获取任务详情验证
      console.log(chalk.yellow(`2. 验证任务 ${taskId}...`));
      const getResult = await callFunction('getTask', { taskId });
      console.log(chalk.green('任务获取结果:'), JSON.stringify(getResult, null, 2));
      
      // 3. 验证标题是否匹配
      if (getResult.task?.title !== uniqueTitle) {
        throw new Error(`创建的任务标题不匹配: 期望 "${uniqueTitle}", 实际 "${getResult.task?.title}"`);
      }
      
      return { createResult, getResult, verified: true };
    }
  },
  {
    name: '创建目标并验证',
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
      
      if (!createResult.success) {
        throw new Error('创建目标失败');
      }
      
      // 2. 获取目标列表验证
      console.log(chalk.yellow('2. 验证目标是否在列表中...'));
      const getResult = await callFunction('getGoals', { includeCompleted: false });
      console.log(chalk.green('目标列表获取结果:'), JSON.stringify(getResult, null, 2));
      
      // 3. 验证是否包含创建的目标
      const foundGoal = getResult.goals?.find((goal: Goal) => goal.title === uniqueTitle);
      if (!foundGoal) {
        throw new Error(`在目标列表中未找到创建的目标: ${uniqueTitle}`);
      }
      
      return { createResult, getResult, verified: true };
    }
  },
  {
    name: '创建笔记并验证',
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
      
      if (!createResult.success) {
        throw new Error('创建笔记失败');
      }
      
      // 2. 获取笔记列表验证
      console.log(chalk.yellow('2. 验证笔记是否在列表中...'));
      const getResult = await callFunction('getNotes', { limit: 10 });
      console.log(chalk.green('笔记列表获取结果:'), JSON.stringify(getResult, null, 2));
      
      // 3. 验证是否包含创建的笔记
      const foundNote = getResult.notes?.find((note: Note) => note.title === uniqueTitle);
      if (!foundNote) {
        throw new Error(`在笔记列表中未找到创建的笔记: ${uniqueTitle}`);
      }
      
      return { createResult, getResult, verified: true };
    }
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
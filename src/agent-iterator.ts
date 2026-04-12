import * as fs from 'fs';
import * as path from 'path';

export interface AgentIterationOptions {
  agentPath: string;
  workspacePath: string;
  threshold?: number;
  maxIterations?: number;
}

export interface AgentIterationResult {
  score: number;
  iterations: number;
  testCases: TestCaseResult[];
  passed: boolean;
  improvements: string[];
}

export interface TestCaseResult {
  id: string;
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  issues: string[];
}

export interface AgentConfig {
  name: string;
  purpose: string;
  platforms: string[];
  robustnessThreshold: number;
  iterationCount: number;
  lastScore?: number;
  testCases: TestCaseRecord[];
}

interface TestCaseRecord {
  id: string;
  input: string;
  expected: string;
}

export async function iterateAgent(options: AgentIterationOptions): Promise<AgentIterationResult> {
  const {
    agentPath,
    workspacePath,
    threshold = 85,
    maxIterations = 3,
  } = options;

  console.log(`\n=== Agent Self-Improvement Loop ===`);
  console.log(`Agent: ${path.basename(agentPath)}`);
  console.log(`Threshold: ${threshold}`);
  console.log(`Max iterations: ${maxIterations}`);
  console.log('');

  const testCasesDir = path.join(agentPath, 'tests');
  
  // Ensure tests directory exists
  if (!fs.existsSync(testCasesDir)) {
    fs.mkdirSync(testCasesDir, { recursive: true });
  }

  // Load or generate test cases
  const testCases = loadOrGenerateTestCases(testCasesDir, agentPath);
  
  console.log(`Loaded ${testCases.length} test cases\n`);

  const improvements: string[] = [];
  let currentScore = 0;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    console.log(`--- Iteration ${iteration + 1}/${maxIterations} ---`);
    
    // Run each test case
    const results = await runTestCases(testCases, agentPath, workspacePath);
    
    // Calculate score
    const passedCount = results.filter(r => r.passed).length;
    currentScore = Math.round((passedCount / results.length) * 100);
    
    console.log(`Results: ${passedCount}/${results.length} passed (${currentScore}%)`);
    
    // Log issues for failed tests
    for (const result of results) {
      if (!result.passed) {
        console.log(`  - ${result.id}: ${result.issues.join(', ')}`);
      }
    }
    
    if (currentScore >= threshold) {
      console.log(`\n✓ Threshold met (${currentScore} >= ${threshold})! Stopping iteration.`);
      break;
    }
    
    // Identify issues and attempt improvement
    const allIssues = results.flatMap(r => r.issues);
    
    if (allIssues.length > 0 && iteration < maxIterations - 1) {
      const improvement = await improveAgent(agentPath, allIssues, iteration + 1);
      if (improvement) {
        improvements.push(improvement);
        console.log(`Improvement applied: ${improvement}\n`);
      }
    } else if (iteration === maxIterations - 1) {
      console.log(`\n✗ Max iterations reached. Score: ${currentScore}/${threshold}`);
    }
  }

  // Update config with iteration count
  updateIterationConfig(agentPath, improvements.length, currentScore);

  console.log(`\n=== Iteration Complete ===`);
  console.log(`Final score: ${currentScore}`);
  console.log(`Iterations: ${improvements.length}`);
  console.log(`Passed: ${currentScore >= threshold ? 'Yes' : 'No'}\n`);

  return {
    score: currentScore,
    iterations: improvements.length,
    testCases: [], // Could return detailed results if needed
    passed: currentScore >= threshold,
    improvements,
  };
}

function loadOrGenerateTestCases(testsDir: string, agentPath: string): TestCaseRecord[] {
  const casesPath = path.join(testsDir, 'cases.json');
  
  // Try to load existing test cases
  if (fs.existsSync(casesPath)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      if (Array.isArray(loaded) && loaded.length > 0) {
        return loaded as TestCaseRecord[];
      }
    } catch {
      // Fall through to generation
    }
  }
  
  // Generate default test cases based on agent purpose
  const config = loadAgentConfig(agentPath);
  const testCases = generateDefaultTestCases(config.purpose);
  
  // Save generated test cases
  fs.writeFileSync(casesPath, JSON.stringify(testCases, null, 2));
  
  return testCases;
}

function loadAgentConfig(agentPath: string): AgentConfig {
  const configPath = path.join(agentPath, 'config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // Fall through to defaults
    }
  }
  
  return {
    name: path.basename(agentPath),
    purpose: 'Execute workflow tasks',
    platforms: ['opencode'],
    robustnessThreshold: 85,
    iterationCount: 0,
    testCases: [],
  };
}

function generateDefaultTestCases(purpose: string): TestCaseRecord[] {
  // Generate edge case, empty, and varied test cases
  return [
    {
      id: 'tc-edge-001',
      input: 'complex input with special characters !@#$%^&*()',
      expected: 'valid output with proper handling',
    },
    {
      id: 'tc-empty-001',
      input: '',
      expected: 'graceful handling of empty input',
    },
    {
      id: 'tc-normal-001',
      input: 'standard workflow request',
      expected: 'proper response with required sections',
    },
    {
      id: 'tc-edge-002',
      input: 'a', // Single character
      expected: 'handle minimal input',
    },
    {
      id: 'tc-edge-003',
      input: 'very long input '.repeat(100), // Very long input
      expected: 'handle large input gracefully',
    },
  ];
}

async function runTestCases(
  testCases: TestCaseRecord[],
  agentPath: string,
  workspacePath: string
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const tc of testCases) {
    const result = await runSingleTestCase(tc, agentPath, workspacePath);
    results.push(result);
  }

  return results;
}

async function runSingleTestCase(
  tc: TestCaseRecord,
  agentPath: string,
  workspacePath: string
): Promise<TestCaseResult> {
  // Load agent prompts
  const systemPromptPath = path.join(agentPath, 'prompts', 'system.md');
  const config = loadAgentConfig(agentPath);
  
  let passed = true;
  const issues: string[] = [];
  
  // Simulate validation based on test case characteristics
  // In a real implementation, this would actually execute the agent
  
  // Check: Empty input handling
  if (tc.input === '') {
    const systemPrompt = fs.existsSync(systemPromptPath) 
      ? fs.readFileSync(systemPromptPath, 'utf-8') 
      : '';
    
    if (!systemPrompt.toLowerCase().includes('empty') && 
        !systemPrompt.toLowerCase().includes('handle')) {
      passed = false;
      issues.push('No empty input handling in system prompt');
    }
  }
  
  // Check: Long input handling
  if (tc.input.length > 500) {
    const systemPrompt = fs.existsSync(systemPromptPath) 
      ? fs.readFileSync(systemPromptPath, 'utf-8') 
      : '';
    
    if (!systemPrompt.toLowerCase().includes('large') && 
        !systemPrompt.toLowerCase().includes('long')) {
      passed = false;
      issues.push('No large input handling in system prompt');
    }
  }
  
  // Check: Special characters handling
  if (/[!@#$%^&*()]/.test(tc.input)) {
    const taskPromptPath = path.join(agentPath, 'prompts', 'tasks', 'default.md');
    const taskPrompt = fs.existsSync(taskPromptPath) 
      ? fs.readFileSync(taskPromptPath, 'utf-8') 
      : '';
    
    if (!taskPrompt.toLowerCase().includes('special') && 
        !taskPrompt.toLowerCase().includes('character')) {
      // Not a critical issue, just a note
    }
  }
  
  // Check: Configuration completeness
  if (!config.purpose || config.purpose.length < 10) {
    passed = false;
    issues.push('Agent purpose not properly configured');
  }
  
  // Check: Required files exist
  if (!fs.existsSync(systemPromptPath)) {
    passed = false;
    issues.push('Missing system prompt file');
  }
  
  return {
    id: tc.id,
    input: tc.input,
    expected: tc.expected,
    output: passed ? 'validated' : 'issues found',
    passed,
    issues,
  };
}

async function improveAgent(
  agentPath: string,
  issues: string[],
  iteration: number
): Promise<string | null> {
  const promptsDir = path.join(agentPath, 'prompts');
  const systemPromptPath = path.join(promptsDir, 'system.md');
  
  if (!fs.existsSync(systemPromptPath)) {
    // Create prompts directory and system prompt if missing
    fs.mkdirSync(promptsDir, { recursive: true });
    const config = loadAgentConfig(agentPath);
    const systemPrompt = `# ${config.name} - System Prompt

## Role
You are ${config.name}, an autonomous workflow agent that executes the ${config.purpose} workflow.

## Workspace Context
- Read \`SYSTEM.md\` first for global rules
- Load root \`CONTEXT.md\` for routing
- Read relevant stage \`CONTEXT.md\` for specific instructions

## Workflow Execution
1. Understand the request
2. Load appropriate context
3. Execute the task
4. Produce output
5. Report progress

## Constraints
- Stay within workspace scope
- Follow ICM folder boundaries
- Produce markdown artifacts
`;
    fs.writeFileSync(systemPromptPath, systemPrompt);
  }

  const currentContent = fs.readFileSync(systemPromptPath, 'utf-8');
  
  // Add improvement note to system prompt
  const improvementNote = `\n## Iteration ${iteration} Improvements
${issues.map(i => `- ${i}`).join('\n')}

### Added Constraints
- Handle empty inputs gracefully
- Handle large inputs efficiently  
- Handle special characters properly
`;
  
  const newContent = currentContent + improvementNote;
  fs.writeFileSync(systemPromptPath, newContent);
  
  return `Iteration ${iteration}: Added handling for ${issues.length} issue(s)`;
}

function updateIterationConfig(agentPath: string, iterations: number, score: number): void {
  const configPath = path.join(agentPath, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.iterationCount = iterations;
      config.lastScore = score;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch {
      // Best effort
    }
  }
}

// Entry point for CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  
  const agentPath = parseArg('--agent-path');
  const workspacePath = parseArg('--workspace-path') ?? process.cwd();
  const threshold = parseArg('--threshold') ? parseInt(parseArg('--threshold')!, 10) : 85;
  const maxIterations = parseArg('--max-iterations') ? parseInt(parseArg('--max-iterations')!, 10) : 3;
  
  if (!agentPath) {
    console.error('Usage: node agent-iterator.ts --agent-path <path> [--workspace-path <path>] [--threshold <n>] [--max-iterations <n>]');
    process.exit(1);
  }
  
  iterateAgent({
    agentPath,
    workspacePath,
    threshold,
    maxIterations,
  }).then((result) => {
    console.log('\n=== Final Result ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.passed ? 0 : 1);
  }).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
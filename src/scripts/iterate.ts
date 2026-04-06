import * as fs from 'fs';
import * as path from 'path';
import { validateWorkspace } from './validate';

export interface IterateOptions {
  maxRetries?: number;
}

export interface ValidatePassResult {
  status: 'passed' | 'failed' | 'escalated';
  retries: number;
  failures?: string[];
}

export interface ScorePassResult {
  score: number;
  improvements: string[];
}

export interface ChecklistResult {
  items: number;
  passed: number;
  failed: number;
  details: { name: string; passed: boolean }[];
}

export interface IterateResult {
  passes: {
    validate: ValidatePassResult;
    score: ScorePassResult;
    checklist: ChecklistResult;
  };
  escalate: boolean;
}

export interface ScoreBreakdown {
  system: number;
  context: number;
  stages: number;
  tools: number;
  total: number;
  improvements: string[];
}

export function iterateWorkspace(
  workspacePath: string,
  options: IterateOptions = {},
): IterateResult {
  const { maxRetries = 3 } = options;
  const ws = path.resolve(workspacePath);

  const validateResult = runValidatePass(ws, maxRetries);
  const scoreResult = runScorePass(ws);
  const checklistResult = runChecklist(ws);

  const result: IterateResult = {
    passes: {
      validate: validateResult,
      score: scoreResult,
      checklist: checklistResult,
    },
    escalate: validateResult.status === 'escalated',
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function runValidatePass(ws: string, maxRetries: number): ValidatePassResult {
  let retries = 0;

  for (let i = 0; i < maxRetries; i++) {
    const result = validateWorkspace(ws);

    if (result.passed) {
      return { status: 'passed', retries: i };
    }

    retries = i + 1;
  }

  const lastResult = validateWorkspace(ws);
  const failures = lastResult.checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.message}`);

  return {
    status: 'escalated',
    retries,
    failures,
  };
}

function runScorePass(ws: string): ScorePassResult {
  const score = scoreWorkspace(ws);
  return {
    score: score.total,
    improvements: score.improvements,
  };
}

export function scoreWorkspace(workspacePath: string): ScoreBreakdown {
  const ws = path.resolve(workspacePath);
  const improvements: string[] = [];
  let system = 0;
  let context = 0;
  let stages = 0;
  let tools = 0;

  const systemMdPath = path.join(ws, 'SYSTEM.md');
  if (fs.existsSync(systemMdPath)) {
    const content = fs.readFileSync(systemMdPath, 'utf-8');
    if (content.toLowerCase().includes('## role') || content.toLowerCase().includes('role')) system += 7;
    else improvements.push('SYSTEM.md missing Role section');
    if (content.toLowerCase().includes('folder map')) system += 7;
    else improvements.push('SYSTEM.md missing Folder Map');
    if (content.toLowerCase().includes('## rules') || content.toLowerCase().includes('rule')) system += 6;
    else improvements.push('SYSTEM.md missing Rules section');
  } else {
    improvements.push('SYSTEM.md missing entirely');
  }

  const contextMdPath = path.join(ws, 'CONTEXT.md');
  if (fs.existsSync(contextMdPath)) {
    const content = fs.readFileSync(contextMdPath, 'utf-8');
    if (content.toLowerCase().includes('routing table')) context += 10;
    else improvements.push('CONTEXT.md missing Routing Table');
    const numberedFolders = getNumberedFolders(ws);
    const allReferenced = numberedFolders.every((f) => content.includes(f));
    if (allReferenced && numberedFolders.length > 0) context += 10;
    else if (numberedFolders.length > 0) improvements.push('CONTEXT.md does not reference all stages');
  } else {
    improvements.push('CONTEXT.md missing entirely');
  }

  const stageFolders = getNumberedFolders(ws);
  let stageScore = 0;
  for (const folder of stageFolders) {
    const stageContextPath = path.join(ws, folder, 'CONTEXT.md');
    let folderScore = 0;
    if (fs.existsSync(stageContextPath)) {
      const content = fs.readFileSync(stageContextPath, 'utf-8');
      if (content.toLowerCase().includes('purpose') || content.toLowerCase().includes('## purpose')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Purpose`);
      if (content.toLowerCase().includes('input')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Inputs`);
      if (content.toLowerCase().includes('output')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Outputs`);
      if (content.toLowerCase().includes('dependenc')) folderScore += 3;
      else improvements.push(`${folder}/CONTEXT.md missing Dependencies`);
    } else {
      improvements.push(`${folder}/CONTEXT.md missing`);
    }
    stageScore += folderScore;
  }
  stages = Math.min(stageScore, 45);

  const toolsMdPath = path.join(ws, '00-meta', 'tools.md');
  if (fs.existsSync(toolsMdPath)) {
    const content = fs.readFileSync(toolsMdPath, 'utf-8');
    if (content.trim().length > 20) tools += 15;
    else {
      tools += 5;
      improvements.push('tools.md exists but has minimal content');
    }
  } else {
    improvements.push('tools.md missing');
  }

  return {
    system,
    context,
    stages,
    tools,
    total: system + context + stages + tools,
    improvements,
  };
}

export function runChecklist(workspacePath: string): ChecklistResult {
  const ws = path.resolve(workspacePath);
  const details: { name: string; passed: boolean }[] = [];

  const stageFolders = getNumberedFolders(ws);

  for (const folder of stageFolders) {
    const contextPath = path.join(ws, folder, 'CONTEXT.md');
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      details.push({
        name: `${folder} has inputs defined`,
        passed: content.toLowerCase().includes('input'),
      });
      details.push({
        name: `${folder} has outputs defined`,
        passed: content.toLowerCase().includes('output'),
      });
      details.push({
        name: `${folder} has dependencies defined`,
        passed: content.toLowerCase().includes('dependenc'),
      });
    } else {
      details.push({ name: `${folder} has CONTEXT.md`, passed: false });
      details.push({ name: `${folder} has inputs defined`, passed: false });
      details.push({ name: `${folder} has outputs defined`, passed: false });
      details.push({ name: `${folder} has dependencies defined`, passed: false });
    }
  }

  const contextMdPath = path.join(ws, 'CONTEXT.md');
  if (fs.existsSync(contextMdPath)) {
    const content = fs.readFileSync(contextMdPath, 'utf-8');
    const allReferenced = stageFolders.every((f) => content.includes(f));
    details.push({
      name: 'Routing table references all numbered folders',
      passed: allReferenced,
    });
  } else {
    details.push({
      name: 'Routing table references all numbered folders',
      passed: false,
    });
  }

  const readmePath = path.join(ws, 'README.md');
  details.push({
    name: 'README.md exists and has usage instructions',
    passed: fs.existsSync(readmePath) && fs.readFileSync(readmePath, 'utf-8').trim().length > 0,
  });

  const passed = details.filter((d) => d.passed).length;
  const failed = details.filter((d) => !d.passed).length;

  return {
    items: details.length,
    passed,
    failed,
    details,
  };
}

function getNumberedFolders(workspacePath: string): string[] {
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name) && e.name !== '00-meta')
    .map((e) => e.name);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const workspace = parseArg('--workspace');
  const maxRetriesStr = parseArg('--max-retries');
  const maxRetries = maxRetriesStr ? parseInt(maxRetriesStr, 10) : 3;

  if (!workspace) {
    console.error('Usage: node iterate.ts --workspace <path> [--max-retries <n>]');
    process.exit(1);
  }

  iterateWorkspace(workspace, { maxRetries });
}

import * as fs from 'fs';
import * as path from 'path';

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: CheckResult[];
}

const REQUIRED_SYSTEM_HEADINGS = [
  '## Role',
  '## Folder Map',
  '## Workflow Rules',
  '## Scope Guardrails',
  '## Sequential Execution Protocol',
  '## Stage Boundaries',
  '## Tooling Policy',
];

const REQUIRED_ROOT_CONTEXT_HEADINGS = [
  '## How to Use This File',
  '## Task Routing',
  '## Loading Order',
  '## Scope Guardrails',
  '## Sequential Routing Contract',
  '## Stage Handoff Routing',
  '## Escalation',
];

const REQUIRED_STAGE_CONTEXT_HEADINGS = [
  '## Purpose',
  '## Inputs',
  '## Outputs',
  '## Dependencies',
  '## Required Evidence',
  '## Completion Criteria',
  '## Handoff',
];

const DISALLOWED_STAGE_SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.go',
  '.rs',
  '.cs',
  '.cpp',
  '.c',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.scala',
]);

export function validateWorkspace(workspacePath: string): ValidationResult {
  const ws = path.resolve(workspacePath);
  const checks: CheckResult[] = [];
  const numberedFolders = getNumberedStageFolders(ws);

  const systemMdPath = path.join(ws, 'SYSTEM.md');
  const systemExists = fs.existsSync(systemMdPath);
  checks.push({
    name: 'SYSTEM.md exists',
    passed: systemExists,
    message: systemExists ? 'Found' : 'Missing',
  });

  if (systemExists) {
    const systemContent = fs.readFileSync(systemMdPath, 'utf-8');
    const hasFolderMap = systemContent.toLowerCase().includes('folder map');
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: hasFolderMap,
      message: hasFolderMap ? 'Found' : 'Missing "folder map" reference',
    });

    addRequiredHeadingChecks('SYSTEM.md', systemContent, REQUIRED_SYSTEM_HEADINGS, checks);
  } else {
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: false,
      message: 'Cannot check — SYSTEM.md missing',
    });

    for (const heading of REQUIRED_SYSTEM_HEADINGS) {
      checks.push({
        name: `SYSTEM.md contains ${heading}`,
        passed: false,
        message: `Cannot check - SYSTEM.md missing`,
      });
    }
  }

  const contextMdPath = path.join(ws, 'CONTEXT.md');
  const contextExists = fs.existsSync(contextMdPath);
  checks.push({
    name: 'CONTEXT.md exists at root',
    passed: contextExists,
    message: contextExists ? 'Found' : 'Missing',
  });

  if (contextExists) {
    const contextContent = fs.readFileSync(contextMdPath, 'utf-8');
    addRequiredHeadingChecks('CONTEXT.md', contextContent, REQUIRED_ROOT_CONTEXT_HEADINGS, checks);

    const allReferenced = numberedFolders.every((folder) => contextContent.includes(`${folder}/CONTEXT.md`));
    checks.push({
      name: 'Root routing references all numbered stages',
      passed: allReferenced,
      message: allReferenced ? 'All numbered stages are routed' : 'Missing one or more numbered stage routes',
    });

    const enforcesSelectiveLoading =
      /## Loading Order/i.test(contextContent)
      && /SYSTEM\.md/i.test(contextContent)
      && /Only the task files needed/i.test(contextContent);

    checks.push({
      name: 'Root loading order enforces selective loading',
      passed: enforcesSelectiveLoading,
      message: enforcesSelectiveLoading
        ? 'Selective loading guidance found'
        : 'Loading order lacks selective-loading guidance',
    });
  } else {
    for (const heading of REQUIRED_ROOT_CONTEXT_HEADINGS) {
      checks.push({
        name: `CONTEXT.md contains ${heading}`,
        passed: false,
        message: 'Cannot check - CONTEXT.md missing',
      });
    }

    checks.push({
      name: 'Root routing references all numbered stages',
      passed: false,
      message: 'Cannot check - CONTEXT.md missing',
    });
    checks.push({
      name: 'Root loading order enforces selective loading',
      passed: false,
      message: 'Cannot check - CONTEXT.md missing',
    });
  }

  const executionLogPath = path.join(ws, '00-meta', 'execution-log.md');
  const executionLogExists = fs.existsSync(executionLogPath);
  checks.push({
    name: '00-meta/execution-log.md exists',
    passed: executionLogExists,
    message: executionLogExists ? 'Found' : 'Missing',
  });

  if (executionLogExists) {
    const executionLogContent = fs.readFileSync(executionLogPath, 'utf-8');
    const hasStageChecklistHeading = /## Stage Checklist/i.test(executionLogContent);
    checks.push({
      name: 'Execution log contains stage checklist heading',
      passed: hasStageChecklistHeading,
      message: hasStageChecklistHeading ? 'Found' : 'Missing "## Stage Checklist" heading',
    });

    const hasAllStageChecklistEntries = numberedFolders.every((folder) => {
      const pattern = new RegExp(`^\\s*-\\s*\\[[ xX]\\]\\s+${escapeRegExp(folder)}\\s*$`, 'm');
      return pattern.test(executionLogContent);
    });
    checks.push({
      name: 'Execution log references all numbered stages',
      passed: hasAllStageChecklistEntries,
      message: hasAllStageChecklistEntries
        ? 'All numbered stages are present in checklist'
        : 'Missing one or more numbered stage checklist entries',
    });

    const sequentialOrderValid = hasAllStageChecklistEntries
      ? isExecutionChecklistSequential(executionLogContent, numberedFolders)
      : false;
    checks.push({
      name: 'Execution log stage completion order is sequential',
      passed: sequentialOrderValid,
      message: sequentialOrderValid
        ? 'Stage completion order is sequential'
        : 'Found later stage marked complete before earlier stage',
    });
  } else {
    checks.push({
      name: 'Execution log contains stage checklist heading',
      passed: false,
      message: 'Cannot check - execution log missing',
    });
    checks.push({
      name: 'Execution log references all numbered stages',
      passed: false,
      message: 'Cannot check - execution log missing',
    });
    checks.push({
      name: 'Execution log stage completion order is sequential',
      passed: false,
      message: 'Cannot check - execution log missing',
    });
  }

  for (const folder of numberedFolders) {
    const contextPath = path.join(ws, folder, 'CONTEXT.md');
    const exists = fs.existsSync(contextPath);
    checks.push({
      name: `${folder}/CONTEXT.md exists`,
      passed: exists,
      message: exists ? 'Found' : 'Missing',
    });

    if (exists) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const notEmpty = content.trim().length > 0;
      checks.push({
        name: `${folder}/CONTEXT.md is not empty`,
        passed: notEmpty,
        message: notEmpty ? `${content.trim().length} chars` : 'File is empty',
      });

      addRequiredHeadingChecks(`${folder}/CONTEXT.md`, content, REQUIRED_STAGE_CONTEXT_HEADINGS, checks);

      const deps = extractStageRefs(extractDependenciesSection(content));
      const currentNum = parseInt(folder.slice(0, 2), 10);
      const pointsToLaterStage = deps.some((dep) => parseInt(dep.slice(0, 2), 10) > currentNum);

      checks.push({
        name: `${folder} dependencies do not point to later stages`,
        passed: !pointsToLaterStage,
        message: !pointsToLaterStage ? 'Dependency direction valid' : 'Found dependency on later-numbered stage',
      });
    } else {
      for (const heading of REQUIRED_STAGE_CONTEXT_HEADINGS) {
        checks.push({
          name: `${folder}/CONTEXT.md contains ${heading}`,
          passed: false,
          message: 'Cannot check - CONTEXT.md missing',
        });
      }

      checks.push({
        name: `${folder} dependencies do not point to later stages`,
        passed: false,
        message: 'Cannot check - CONTEXT.md missing',
      });
    }

    const disallowedFiles = findDisallowedStageSourceFiles(path.join(ws, folder));
    checks.push({
      name: `${folder} contains no product source code files`,
      passed: disallowedFiles.length === 0,
      message: disallowedFiles.length === 0
        ? 'Only workflow documentation artifacts found'
        : `Found source files: ${disallowedFiles.join(', ')}`,
    });
  }

  const allFiles = getAllMarkdownFiles(ws);
  const duplicateCheck = checkDuplicateContent(allFiles);
  checks.push(duplicateCheck);

  const passed = checks.every((c) => c.passed);

  console.log(`\nValidation: ${ws}`);
  console.log('='.repeat(50));
  for (const check of checks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  console.log('='.repeat(50));
  console.log(passed ? '✓ All checks passed' : '✗ Some checks failed');

  return { passed, checks };
}

function getAllMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHeading(content: string, heading: string): boolean {
  return new RegExp(`^${escapeRegExp(heading)}\\s*$`, 'im').test(content);
}

function addRequiredHeadingChecks(
  fileLabel: string,
  content: string,
  headings: string[],
  checks: CheckResult[],
): void {
  for (const heading of headings) {
    const found = hasHeading(content, heading);
    checks.push({
      name: `${fileLabel} contains ${heading}`,
      passed: found,
      message: found ? 'Found' : `Missing ${heading}`,
    });
  }
}

function checkDuplicateContent(files: string[]): CheckResult {
  const MIN_DUPLICATE_LENGTH = 50;
  const duplicates: string[] = [];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const contentA = fs.readFileSync(files[i], 'utf-8');
      const contentB = fs.readFileSync(files[j], 'utf-8');

      const linesA = contentA.split('\n');
      const linesB = contentB.split('\n');

      for (const lineA of linesA) {
        const trimmed = lineA.trim();
        if (trimmed.length > MIN_DUPLICATE_LENGTH) {
          for (const lineB of linesB) {
            if (lineB.trim() === trimmed) {
              duplicates.push(trimmed.substring(0, 60) + '...');
              break;
            }
          }
        }
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      name: 'No duplicate content across files',
      passed: false,
      message: `Found ${duplicates.length} duplicate text block(s)`,
    };
  }

  return {
    name: 'No duplicate content across files',
    passed: true,
    message: 'No duplicates found',
  };
}

function getNumberedStageFolders(workspacePath: string): string[] {
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name) && entry.name !== '00-meta')
    .map((entry) => entry.name);
}

function extractDependenciesSection(content: string): string {
  const match = content.match(/## Dependencies\s*([\s\S]*?)(?=\n##\s|$)/i);
  return match ? match[1] : '';
}

function extractStageRefs(content: string): string[] {
  const refs = new Set<string>();
  const regex = /(\d{2}-[A-Za-z0-9-_]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    refs.add(match[1]);
  }

  return Array.from(refs);
}

function isExecutionChecklistSequential(content: string, stages: string[]): boolean {
  let foundUncheckedStage = false;

  for (const stage of stages) {
    const pattern = new RegExp(`^\\s*-\\s*\\[([ xX])\\]\\s+${escapeRegExp(stage)}\\s*$`, 'm');
    const match = content.match(pattern);
    if (!match) {
      return false;
    }

    const isChecked = match[1].toLowerCase() === 'x';
    if (!isChecked) {
      foundUncheckedStage = true;
      continue;
    }

    if (foundUncheckedStage) {
      return false;
    }
  }

  return true;
}

function findDisallowedStageSourceFiles(stageDir: string): string[] {
  const disallowed: string[] = [];

  const walk = (currentDir: string): void => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (DISALLOWED_STAGE_SOURCE_EXTENSIONS.has(ext)) {
        disallowed.push(path.relative(stageDir, fullPath).replace(/\\/g, '/'));
      }
    }
  };

  walk(stageDir);

  return disallowed;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceIdx = args.indexOf('--workspace');
  const workspace = workspaceIdx !== -1 ? args[workspaceIdx + 1] : undefined;

  if (!workspace) {
    console.error('Usage: node validate.ts --workspace <path>');
    process.exit(1);
  }

  const result = validateWorkspace(workspace);
  process.exit(result.passed ? 0 : 1);
}

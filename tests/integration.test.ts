import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';

const repoRoot = path.join(__dirname, '..');
const cliPath = path.join(repoRoot, 'dist', 'index.js');
const templatesPath = path.join(repoRoot, 'templates');
const orchestratorPath = path.join(repoRoot, 'dist', 'scripts', 'orchestrator.js');
const dispatchPath = path.join(repoRoot, 'dist', 'scripts', 'dispatch.js');

function writeFileWithParents(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createBasicOrchestratorWorkspace(baseDir: string): string {
  const workspacePath = path.join(baseDir, 'workspace');
  fs.mkdirSync(workspacePath, { recursive: true });

  const stageNames = ['01-input', '02-process', '03-output'];
  for (const stageName of stageNames) {
    const contextPath = path.join(workspacePath, stageName, 'CONTEXT.md');
    writeFileWithParents(
      contextPath,
      [
        '## Purpose',
        `${stageName} purpose for automated integration testing.`,
        '',
        '## Input',
        'Structured data from the prior stage input.',
        '',
        '## Output',
        'Structured output produced by this stage.',
        '',
        '## Dependencies',
        'Depends on upstream context and files.',
        '',
        '## Success Criteria',
        'Produces deterministic and complete output.',
        '',
        '## Approach',
        'Follow the stage workflow and validation checks.',
        '',
        '## Risks',
        'Incorrect transformations can reduce quality.',
        '',
        '## Timeline',
        'This stage completes in a single iteration.',
        '',
        '## Resources',
        'Uses the local skill templates and reports.',
        '',
        '## Validation',
        'Validate outputs against expected structure.',
        '',
      ].join('\n'),
    );
  }

  writeFileWithParents(
    path.join(workspacePath, '.agents', 'skills', 'workspace-maxxing', 'skills', 'worker', 'SKILL.md'),
    '---\nname: worker\n---\n\n# Worker\n\nIntegration worker skill fixture.\n',
  );

  writeFileWithParents(
    path.join(workspacePath, '.agents', 'skills', 'workspace-maxxing', 'skills', 'fixer', 'SKILL.md'),
    '---\nname: fixer\n---\n\n# Fixer\n\nIntegration fixer skill fixture.\n',
  );

  return workspacePath;
}

function runOrchestrator(orchestratorPath: string, workspacePath: string, extraArgs: string[] = []): string {
  return execFileSync(
    process.execPath,
    [orchestratorPath, '--workspace', workspacePath, '--batch-size', '2', ...extraArgs],
    { encoding: 'utf-8' },
  );
}

function runDispatch(dispatchScriptPath: string, args: string[]): string {
  return execFileSync(
    process.execPath,
    [dispatchScriptPath, ...args],
    { encoding: 'utf-8' },
  );
}

function runBuildOnce(): void {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    execFileSync(process.execPath, [npmExecPath, 'run', 'build'], {
      cwd: repoRoot,
      stdio: 'pipe',
    });
    return;
  }

  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
}

function runInstaller(targetDir: string): string {
  return execFileSync(process.execPath, [cliPath, '--opencode'], {
    cwd: targetDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      WORKSPACE_MAXXING_TEMPLATES: templatesPath,
    },
  });
}

function snapshotDirectory(rootDir: string): { files: string[]; hash: string } {
  const files: string[] = [];

  const walk = (currentDir: string): void => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else {
        files.push(path.relative(rootDir, absolutePath));
      }
    }
  };

  walk(rootDir);
  files.sort();

  const hash = createHash('sha256');
  for (const relativeFilePath of files) {
    hash.update(relativeFilePath);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(rootDir, relativeFilePath)));
  }

  return {
    files,
    hash: hash.digest('hex'),
  };
}

beforeAll(() => {
  runBuildOnce();
});

describe('Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-integration-'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('end-to-end: install and verify complete structure', () => {
    // Run installer
    const output = runInstaller(tempDir);

    expect(output).toContain('installed');

    // Verify skill directory
    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(skillDir)).toBe(true);

    // Verify all expected files exist
    const expectedFiles = [
      'SKILL.md',
      '.workspace-templates/SYSTEM.md',
      '.workspace-templates/CONTEXT.md',
      '.workspace-templates/workspace/00-meta/CONTEXT.md',
      '.workspace-templates/workspace/01-input/CONTEXT.md',
      '.workspace-templates/workspace/02-process/CONTEXT.md',
      '.workspace-templates/workspace/03-output/CONTEXT.md',
      '.workspace-templates/workspace/README.md',
      'scripts/scaffold.ts',
      'scripts/validate.ts',
      'scripts/install-tool.ts',
      'scripts/iterate.ts',
      'scripts/generate-tests.ts',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(skillDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    }

    // Verify SKILL.md has required sections
    const skillContent = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
    expect(skillContent).toContain('## Overview');
    expect(skillContent).toContain('## When to Use');
    expect(skillContent).toContain('## The Iron Law');
    expect(skillContent).toContain('## Execution Mode: Inline Workflow');
    expect(skillContent).toContain('## Anti-Rationalization Table');
    expect(skillContent).toContain('## ICM Rules');
    expect(skillContent).toContain('## Output Format');

    // Verify SYSTEM.md has Layer 0 content
    const systemContent = fs.readFileSync(path.join(skillDir, '.workspace-templates', 'SYSTEM.md'), 'utf-8');
    expect(systemContent.toLowerCase()).toContain('folder map');
  });

  it('idempotency: running install twice produces valid result', () => {
    const firstOutput = runInstaller(tempDir);
    expect(firstOutput).toContain('installed');

    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);

    const firstSnapshot = snapshotDirectory(skillDir);
    expect(firstSnapshot.files.length).toBeGreaterThan(0);
    expect(firstSnapshot.files).toContain('SKILL.md');
    expect(firstSnapshot.files).toContain(path.join('scripts', 'iterate.ts'));

    const secondOutput = runInstaller(tempDir);
    expect(secondOutput).toContain('installed');

    const secondSnapshot = snapshotDirectory(skillDir);
    expect(secondSnapshot.files).toEqual(firstSnapshot.files);
    expect(secondSnapshot.hash).toBe(firstSnapshot.hash);
  });
});

describe('orchestrator integration', () => {
  let orchestratorTempDir: string;

  beforeEach(() => {
    orchestratorTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-orchestrator-integration-'));
  });

  afterEach(() => {
    if (orchestratorTempDir) {
      fs.rmSync(orchestratorTempDir, { recursive: true, force: true });
    }
  });

  it('runs full batch lifecycle on a valid workspace via dist orchestrator script', () => {
    const workspacePath = createBasicOrchestratorWorkspace(orchestratorTempDir);

    const output = runOrchestrator(orchestratorPath, workspacePath);
    const result = JSON.parse(output);

    expect(result.totalBatches).toBeGreaterThan(0);
    expect(Array.isArray(result.batchReports)).toBe(true);
    expect(result.batchReports.length).toBe(result.totalBatches);
  });

  it('writes summary.json to .agents/iteration', () => {
    const workspacePath = createBasicOrchestratorWorkspace(orchestratorTempDir);

    runOrchestrator(orchestratorPath, workspacePath);

    const summaryPath = path.join(workspacePath, '.agents', 'iteration', 'summary.json');
    expect(fs.existsSync(summaryPath)).toBe(true);

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.totalBatches).toBeGreaterThan(0);
    expect(typeof summary.timestamp).toBe('string');
  });

  it('worker dispatch fails without external runner command', () => {
    const workspacePath = createBasicOrchestratorWorkspace(orchestratorTempDir);

    const output = runDispatch(dispatchPath, [
      '--skill', 'worker',
      '--workspace', workspacePath,
      '--batch-id', '1',
      '--test-case-id', 'tc-001',
    ]);

    const report = JSON.parse(output);
    expect(report.status).toBe('failed');
    expect(report.findings.join(' ')).toContain('External sub-agent runner is required');
  });

  it('dispatch-recursion runner command does not produce a successful worker execution', () => {
    const workspacePath = createBasicOrchestratorWorkspace(orchestratorTempDir);
    const recursiveRunner = `"${process.execPath}" "${dispatchPath}" --skill {skill} --workspace "{workspace}" --batch-id {batchId} --test-case-id {testCaseId}`;

    const output = runDispatch(dispatchPath, [
      '--skill', 'worker',
      '--workspace', workspacePath,
      '--batch-id', '1',
      '--test-case-id', 'tc-002',
      '--runner-command', recursiveRunner,
    ]);

    const report = JSON.parse(output);
    expect(report.status).toBe('failed');
  });

  it('orchestrator does not mark passing batches when worker execution cannot run', () => {
    const workspacePath = createBasicOrchestratorWorkspace(orchestratorTempDir);

    const output = runOrchestrator(orchestratorPath, workspacePath, ['--score-threshold', '95']);
    const result = JSON.parse(output);

    expect(result.passedBatches).toBe(0);
    expect(result.failedBatches + result.escalatedBatches).toBe(result.totalBatches);
  });
});

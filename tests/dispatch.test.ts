import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dispatchSkill, DispatchReport } from '../src/scripts/dispatch';

describe('dispatchSkill', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads and returns report for a valid sub-skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.skill).toBe('validation');
    expect(result.status).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('returns failed status for non-existent skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const result = dispatchSkill('nonexistent', skillsDir);

    expect(result.skill).toBe('nonexistent');
    expect(result.status).toBe('failed');
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('includes nextSkill recommendation in report', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.nextSkill).toBeDefined();
  });

  it('maps validation to prompt-engineering as next skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.nextSkill).toBe('prompt-engineering');
  });

  it('maps research to architecture as next skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'research'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'research', 'SKILL.md'), '---\nname: research\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('research', skillsDir);

    expect(result.nextSkill).toBe('architecture');
  });

  it('fails worker dispatch when external runner is not configured', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('worker', skillsDir);

    expect(result.status).toBe('failed');
    expect(result.findings.join(' ')).toContain('External sub-agent runner is required');
  });

  it('fails fixer dispatch when external runner is not configured', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'fixer'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'fixer', 'SKILL.md'), '---\nname: fixer\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('fixer', skillsDir);

    expect(result.status).toBe('failed');
    expect(result.findings.join(' ')).toContain('External sub-agent runner is required');
  });

  it('uses external runner command for worker skill when configured', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\ndescription: test\n---\n\n## Overview\nTest');

    const runnerPath = path.join(tempDir, 'runner.js');
    fs.writeFileSync(
      runnerPath,
      [
        'const skill = process.argv[2];',
        'const batchId = Number(process.argv[3]);',
        'const testCaseId = process.argv[4];',
        'console.log(JSON.stringify({',
        '  skill,',
        '  status: "passed",',
        '  timestamp: "2026-04-08T00:00:00.000Z",',
        '  findings: ["external runner executed"],',
        '  recommendations: ["continue"],',
        '  metrics: { executionTimeMs: 12 },',
        '  nextSkill: "validation",',
        '  batchId,',
        '  testCaseId,',
        '}));',
      ].join('\n'),
    );

    const runnerCommand = `"${process.execPath}" "${runnerPath}" {skill} {batchId} {testCaseId}`;

    const result = dispatchSkill('worker', skillsDir, {
      workspacePath: tempDir,
      runnerCommand,
      invocation: {
        skill: 'worker',
        batchId: 1,
        testCaseId: 'tc-001',
      },
    });

    expect(result.status).toBe('passed');
    expect(result.findings).toContain('external runner executed');
    expect(result.nextSkill).toBe('validation');
  });

  it('writes runner telemetry artifact for external worker dispatch', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\ndescription: test\n---\n\n## Overview\nTest');

    const runnerPath = path.join(tempDir, 'runner-telemetry.js');
    fs.writeFileSync(
      runnerPath,
      [
        'const skill = process.argv[2];',
        'const batchId = Number(process.argv[3]);',
        'const testCaseId = process.argv[4];',
        'console.log(JSON.stringify({',
        '  skill,',
        '  status: "passed",',
        '  timestamp: "2026-04-08T00:00:00.000Z",',
        '  findings: ["runner telemetry"],',
        '  recommendations: ["continue"],',
        '  metrics: { executionTimeMs: 7 },',
        '  nextSkill: "validation",',
        '  batchId,',
        '  testCaseId,',
        '}));',
      ].join('\n'),
    );

    const runnerCommand = `"${process.execPath}" "${runnerPath}" {skill} {batchId} {testCaseId}`;

    const result = dispatchSkill('worker', skillsDir, {
      workspacePath: tempDir,
      runnerCommand,
      invocation: {
        skill: 'worker',
        batchId: 1,
        testCaseId: 'tc-telemetry',
      },
    });

    expect(result.status).toBe('passed');

    const runsDir = path.join(tempDir, '.agents', 'iteration', 'runs');
    expect(fs.existsSync(runsDir)).toBe(true);
    const telemetryFiles = fs.readdirSync(runsDir).filter((f) => f.endsWith('.json'));
    expect(telemetryFiles.length).toBeGreaterThan(0);

    const telemetry = JSON.parse(fs.readFileSync(path.join(runsDir, telemetryFiles[0]), 'utf-8'));
    expect(telemetry.skill).toBe('worker');
    expect(telemetry.status).toBe('passed');
    expect(telemetry.batchId).toBe(1);
    expect(telemetry.testCaseId).toBe('tc-telemetry');
    expect(telemetry.commandTemplate).toContain('{skill}');
    expect(typeof telemetry.durationMs).toBe('number');
  });

  it('returns failed status when external runner command fails', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\ndescription: test\n---\n\n## Overview\nTest');

    const runnerPath = path.join(tempDir, 'failing-runner.js');
    fs.writeFileSync(
      runnerPath,
      [
        'console.error("runner failed");',
        'process.exit(2);',
      ].join('\n'),
    );

    const runnerCommand = `"${process.execPath}" "${runnerPath}"`;

    const result = dispatchSkill('worker', skillsDir, {
      workspacePath: tempDir,
      runnerCommand,
      invocation: {
        skill: 'worker',
        batchId: 2,
        testCaseId: 'tc-002',
      },
    });

    expect(result.status).toBe('failed');
    expect(result.findings.join(' ')).toContain('runner failed');
  });
});

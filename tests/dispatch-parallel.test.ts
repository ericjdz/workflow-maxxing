import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dispatchSkill, dispatchParallel, ParallelDispatchResult, ParallelInvocation } from '../src/scripts/dispatch';

describe('parallel dispatch', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-parallel-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('dispatches multiple skills in parallel and aggregates results', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\n---\n\nTest');

    const invocations: ParallelInvocation[] = [
      { skill: 'worker', batchId: 1, testCaseId: 'tc-001' },
      { skill: 'worker', batchId: 1, testCaseId: 'tc-002' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('passed');
    expect(results[1].status).toBe('passed');
  });

  it('includes batchId and testCaseId in results', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\n---\n\nTest');

    const invocations: ParallelInvocation[] = [
      { skill: 'validation', batchId: 2, testCaseId: 'tc-003' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results[0].batchId).toBe(2);
    expect(results[0].testCaseId).toBe('tc-003');
  });

  it('handles missing skill gracefully in parallel mode', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const invocations: ParallelInvocation[] = [
      { skill: 'nonexistent', batchId: 1, testCaseId: 'tc-001' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results[0].status).toBe('failed');
  });

  it('supports external runner mode for worker invocations', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\n---\n\nTest');

    const runnerPath = path.join(tempDir, 'parallel-runner.js');
    fs.writeFileSync(
      runnerPath,
      [
        'const args = process.argv.slice(2);',
        'const skill = args[0];',
        'const batchId = Number(args[1]);',
        'const testCaseId = args[2];',
        'console.log(JSON.stringify({',
        '  skill,',
        '  status: "passed",',
        '  timestamp: "2026-04-08T00:00:00.000Z",',
        '  findings: ["parallel runner executed"],',
        '  recommendations: ["continue"],',
        '  metrics: { executionTimeMs: 8 },',
        '  nextSkill: "validation",',
        '  batchId,',
        '  testCaseId,',
        '}));',
      ].join('\n'),
    );

    const invocations: ParallelInvocation[] = [
      { skill: 'worker', batchId: 3, testCaseId: 'tc-010' },
      { skill: 'worker', batchId: 3, testCaseId: 'tc-011' },
    ];

    const runnerCommand = `"${process.execPath}" "${runnerPath}" {skill} {batchId} {testCaseId}`;
    const results = dispatchParallel(invocations, skillsDir, {
      workspacePath: tempDir,
      runnerCommand,
      runnerTimeoutSeconds: 10,
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('passed');
    expect(results[1].status).toBe('passed');
    expect(results[0].findings).toContain('parallel runner executed');
    expect(results[1].testCaseId).toBe('tc-011');
  });
});

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
});

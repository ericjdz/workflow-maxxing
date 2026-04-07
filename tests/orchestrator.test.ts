import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { splitIntoBatches, createBatchDirectory, getBatchDirectory, createTestCaseDirectory, runBatchLifecycle } from '../src/scripts/orchestrator';
import * as dispatch from '../src/scripts/dispatch';
import * as generateTests from '../src/scripts/generate-tests';
import * as benchmark from '../src/scripts/benchmark';

describe('orchestrator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('splitIntoBatches', () => {
    it('splits items into batches of specified size', () => {
      const items = ['tc-001', 'tc-002', 'tc-003', 'tc-004', 'tc-005'];
      const result = splitIntoBatches(items, 3);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(['tc-001', 'tc-002', 'tc-003']);
      expect(result[1]).toEqual(['tc-004', 'tc-005']);
    });

    it('returns single batch when items fit', () => {
      const items = ['tc-001', 'tc-002'];
      const result = splitIntoBatches(items, 3);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(['tc-001', 'tc-002']);
    });

    it('returns empty array for empty input', () => {
      const result = splitIntoBatches([], 3);
      expect(result).toEqual([]);
    });

    it('uses default batch size of 3 when not specified', () => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const result = splitIntoBatches(items);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(3);
      expect(result[1]).toHaveLength(3);
      expect(result[2]).toHaveLength(1);
    });

    it('throws for invalid batch sizes to prevent non-terminating loops', () => {
      expect(() => splitIntoBatches(['tc-001'], 0)).toThrow(/Invalid batchSize/);
      expect(() => splitIntoBatches(['tc-001'], -1)).toThrow(/Invalid batchSize/);
      expect(() => splitIntoBatches(['tc-001'], 1.5)).toThrow(/Invalid batchSize/);
      expect(() => splitIntoBatches(['tc-001'], Number.NaN)).toThrow(/Invalid batchSize/);
    });
  });

  describe('batch directory management', () => {
    it('creates batch directory structure', () => {
      const baseDir = path.join(tempDir, '.agents', 'iteration');
      const result = createBatchDirectory(baseDir, 1);

      expect(fs.existsSync(result)).toBe(true);
      expect(result).toContain('batch-01');
    });

    it('returns existing batch directory path', () => {
      const baseDir = path.join(tempDir, '.agents', 'iteration');
      fs.mkdirSync(path.join(baseDir, 'batch-02'), { recursive: true });

      const result = getBatchDirectory(baseDir, 2);
      expect(result).toContain('batch-02');
    });

    it('creates test case directory within batch', () => {
      const baseDir = path.join(tempDir, '.agents', 'iteration');
      const batchDir = createBatchDirectory(baseDir, 1);
      const tcDir = createTestCaseDirectory(batchDir, 'tc-001');

      expect(fs.existsSync(tcDir)).toBe(true);
      expect(tcDir).toContain('tc-001');
    });
  });

  describe('batch lifecycle', () => {
    it('rejects invalid numeric config values before running lifecycle', () => {
      expect(() => runBatchLifecycle(tempDir, { batchSize: 0 })).toThrow(/Invalid batchSize/);
      expect(() => runBatchLifecycle(tempDir, { maxFixRetries: -1 })).toThrow(/Invalid maxFixRetries/);
      expect(() => runBatchLifecycle(tempDir, { scoreThreshold: 101 })).toThrow(/Invalid scoreThreshold/);
      expect(() => runBatchLifecycle(tempDir, { workerTimeout: 0 })).toThrow(/Invalid workerTimeout/);
    });

    it('runs full lifecycle and writes summary for passing batches', () => {
      jest.spyOn(generateTests, 'generateTestCases').mockReturnValue({
        testCases: [
          { stage: '01-input', type: 'sample', input: 'a', expected: 'a' },
          { stage: '02-output', type: 'sample', input: 'b', expected: 'b' },
          { stage: '03-review', type: 'sample', input: 'c', expected: 'c' },
          { stage: '04-wrap', type: 'sample', input: 'd', expected: 'd' },
        ],
      });

      const dispatchSpy = jest.spyOn(dispatch, 'dispatchParallel').mockImplementation((invocations) => {
        return invocations.map((inv) => ({
          skill: inv.skill,
          status: 'passed',
          batchId: inv.batchId,
          testCaseId: inv.testCaseId,
          timestamp: '2026-04-07T00:00:00.000Z',
          findings: [],
          recommendations: ['continue'],
          metrics: { latencyMs: 10 },
          nextSkill: 'validation',
        }));
      });

      jest.spyOn(benchmark, 'calculateBenchmark')
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 80,
          weightedScore: 92,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 78,
          weightedScore: 88,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        });

      const result = runBatchLifecycle(tempDir, {
        batchSize: 2,
        maxFixRetries: 2,
        scoreThreshold: 85,
        workerTimeout: 300,
      });

      expect(result.totalBatches).toBe(2);
      expect(result.passedBatches).toBe(2);
      expect(result.failedBatches).toBe(0);
      expect(result.escalatedBatches).toBe(0);
      expect(result.overallScore).toBe(90);
      expect(result.batchReports.map((r) => r.status)).toEqual(['passed', 'passed']);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0]).toEqual([
        { skill: 'worker', batchId: 1, testCaseId: 'tc-001' },
        { skill: 'worker', batchId: 1, testCaseId: 'tc-002' },
      ]);
      expect(dispatchSpy.mock.calls[1][0]).toEqual([
        { skill: 'worker', batchId: 2, testCaseId: 'tc-003' },
        { skill: 'worker', batchId: 2, testCaseId: 'tc-004' },
      ]);

      const summaryPath = path.join(tempDir, '.agents', 'iteration', 'summary.json');
      expect(fs.existsSync(summaryPath)).toBe(true);

      const savedSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      expect(savedSummary.totalBatches).toBe(2);
      expect(savedSummary.overallScore).toBe(90);
    });

    it('uses worker timeout to treat long worker dispatch as failed and trigger fixer retry', () => {
      jest.spyOn(generateTests, 'generateTestCases').mockReturnValue({
        testCases: [
          { stage: '01-input', type: 'sample', input: 'slow', expected: 'slow' },
        ],
      });

      const dispatchSpy = jest.spyOn(dispatch, 'dispatchParallel').mockImplementation((invocations) => {
        return invocations.map((inv) => ({
          skill: inv.skill,
          status: 'passed',
          batchId: inv.batchId,
          testCaseId: inv.testCaseId,
          timestamp: '2026-04-07T00:00:00.000Z',
          findings: [],
          recommendations: ['continue'],
          metrics: { latencyMs: 10 },
          nextSkill: 'validation',
        }));
      });

      const nowValues = [0, 2001, 3000, 3001];
      jest.spyOn(Date, 'now').mockImplementation(() => nowValues.shift() ?? 3001);

      jest.spyOn(benchmark, 'calculateBenchmark')
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 90,
          weightedScore: 98,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 91,
          weightedScore: 98,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 91,
          weightedScore: 98,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        });

      const result = runBatchLifecycle(tempDir, {
        batchSize: 1,
        maxFixRetries: 2,
        scoreThreshold: 95,
        workerTimeout: 1,
      });

      expect(result.totalBatches).toBe(1);
      expect(result.passedBatches).toBe(1);
      expect(result.batchReports[0].status).toBe('passed');
      expect(result.batchReports[0].findings.join(' ')).toMatch(/timeout|Timeout/);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0][0].skill).toBe('worker');
      expect(dispatchSpy.mock.calls[1][0][0].skill).toBe('fixer');
    });

    it('marks batch as failed when fixes clear worker failures but score remains below threshold', () => {
      jest.spyOn(generateTests, 'generateTestCases').mockReturnValue({
        testCases: [
          { stage: '01-input', type: 'sample', input: 'needs-work', expected: 'better' },
        ],
      });

      const dispatchSpy = jest.spyOn(dispatch, 'dispatchParallel').mockImplementation((invocations) => {
        if (invocations[0]?.skill === 'worker') {
          return [{
            skill: 'worker',
            status: 'failed',
            batchId: 1,
            testCaseId: 'tc-001',
            timestamp: '2026-04-07T00:00:00.000Z',
            findings: ['output missing'],
            recommendations: ['run fixer'],
            metrics: { latencyMs: 20 },
            nextSkill: 'fixer',
          }];
        }

        return invocations.map((inv) => ({
          skill: inv.skill,
          status: 'passed',
          batchId: inv.batchId,
          testCaseId: inv.testCaseId,
          timestamp: '2026-04-07T00:00:00.000Z',
          findings: ['fixed now'],
          recommendations: ['re-run benchmark'],
          metrics: { latencyMs: 15 },
          nextSkill: 'validation',
        }));
      });

      const benchmarkSpy = jest.spyOn(benchmark, 'calculateBenchmark')
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 60,
          weightedScore: 80,
          stages: [],
          fixSuggestions: ['improve output'],
          improvementPotential: true,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 62,
          weightedScore: 80,
          stages: [],
          fixSuggestions: ['keep improving'],
          improvementPotential: true,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 62,
          weightedScore: 80,
          stages: [],
          fixSuggestions: ['keep improving'],
          improvementPotential: true,
        });

      const result = runBatchLifecycle(tempDir, {
        batchSize: 1,
        maxFixRetries: 3,
        scoreThreshold: 95,
        workerTimeout: 300,
      });

      expect(result.totalBatches).toBe(1);
      expect(result.passedBatches).toBe(0);
      expect(result.failedBatches).toBe(1);
      expect(result.escalatedBatches).toBe(0);
      expect(result.batchReports[0].status).toBe('failed');
      expect(result.batchReports[0].findings.join(' ')).toMatch(/below threshold/);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0][0].skill).toBe('worker');
      expect(dispatchSpy.mock.calls[1][0][0].skill).toBe('fixer');
      expect(benchmarkSpy).toHaveBeenCalledTimes(3);
    });

    it('recovers from below-threshold batch after a successful fix attempt', () => {
      jest.spyOn(generateTests, 'generateTestCases').mockReturnValue({
        testCases: [
          { stage: '01-input', type: 'sample', input: 'recover', expected: 'stable' },
        ],
      });

      const dispatchSpy = jest.spyOn(dispatch, 'dispatchParallel').mockImplementation((invocations) => {
        if (invocations[0]?.skill === 'worker') {
          return [{
            skill: 'worker',
            status: 'failed',
            batchId: 1,
            testCaseId: 'tc-001',
            timestamp: '2026-04-07T00:00:00.000Z',
            findings: ['output missing'],
            recommendations: ['run fixer'],
            metrics: { latencyMs: 20 },
            nextSkill: 'fixer',
          }];
        }

        return invocations.map((inv) => ({
          skill: inv.skill,
          status: 'passed',
          batchId: inv.batchId,
          testCaseId: inv.testCaseId,
          timestamp: '2026-04-07T00:00:00.000Z',
          findings: ['fixed now'],
          recommendations: ['continue'],
          metrics: { latencyMs: 15 },
          nextSkill: 'validation',
        }));
      });

      jest.spyOn(benchmark, 'calculateBenchmark')
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 60,
          weightedScore: 80,
          stages: [],
          fixSuggestions: ['improve output'],
          improvementPotential: true,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 78,
          weightedScore: 97,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        })
        .mockReturnValueOnce({
          workspace: 'test',
          agent: 'test-agent',
          timestamp: '2026-04-07T00:00:00.000Z',
          rawScore: 78,
          weightedScore: 97,
          stages: [],
          fixSuggestions: [],
          improvementPotential: false,
        });

      const result = runBatchLifecycle(tempDir, {
        batchSize: 1,
        maxFixRetries: 3,
        scoreThreshold: 95,
        workerTimeout: 300,
      });

      expect(result.totalBatches).toBe(1);
      expect(result.passedBatches).toBe(1);
      expect(result.failedBatches).toBe(0);
      expect(result.escalatedBatches).toBe(0);
      expect(result.batchReports[0].status).toBe('passed');
      expect(result.batchReports[0].findings).toContain('Fix attempt 1: 1 fixes applied');

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0][0].skill).toBe('worker');
      expect(dispatchSpy.mock.calls[1][0][0].skill).toBe('fixer');
    });

    it('runs fix loop and escalates when retries are exhausted below score threshold', () => {
      jest.spyOn(generateTests, 'generateTestCases').mockReturnValue({
        testCases: [
          { stage: '01-input', type: 'sample', input: 'needs-fix', expected: 'fixed' },
        ],
      });

      const dispatchSpy = jest.spyOn(dispatch, 'dispatchParallel').mockImplementation((invocations) => {
        if (invocations[0]?.skill === 'worker') {
          return [{
            skill: 'worker',
            status: 'failed',
            batchId: 1,
            testCaseId: 'tc-001',
            timestamp: '2026-04-07T00:00:00.000Z',
            findings: ['output missing'],
            recommendations: ['run fixer'],
            metrics: { latencyMs: 20 },
            nextSkill: 'fixer',
          }];
        }

        return invocations.map((inv) => ({
          skill: inv.skill,
          status: 'failed',
          batchId: inv.batchId,
          testCaseId: inv.testCaseId,
          timestamp: '2026-04-07T00:00:00.000Z',
          findings: ['still failing'],
          recommendations: ['retry'],
          metrics: { latencyMs: 15 },
          nextSkill: 'validation',
        }));
      });

      const benchmarkSpy = jest.spyOn(benchmark, 'calculateBenchmark').mockReturnValue({
        workspace: 'test',
        agent: 'test-agent',
        timestamp: '2026-04-07T00:00:00.000Z',
        rawScore: 60,
        weightedScore: 90,
        stages: [],
        fixSuggestions: ['improve output'],
        improvementPotential: true,
      });

      const result = runBatchLifecycle(tempDir, {
        batchSize: 1,
        maxFixRetries: 2,
        scoreThreshold: 95,
        workerTimeout: 300,
      });

      expect(result.totalBatches).toBe(1);
      expect(result.passedBatches).toBe(0);
      expect(result.failedBatches).toBe(0);
      expect(result.escalatedBatches).toBe(1);
      expect(result.batchReports[0].status).toBe('escalated');
      expect(result.batchReports[0].findings).toContain('Max retries exhausted');

      expect(dispatchSpy).toHaveBeenCalledTimes(3);
      expect(dispatchSpy.mock.calls[0][0][0].skill).toBe('worker');
      expect(dispatchSpy.mock.calls[1][0][0].skill).toBe('fixer');
      expect(dispatchSpy.mock.calls[2][0][0].skill).toBe('fixer');

      expect(benchmarkSpy).toHaveBeenCalledTimes(4);
    });
  });
});

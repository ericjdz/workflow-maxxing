import * as fs from 'fs';
import * as path from 'path';

export interface OrchestratorConfig {
  batchSize?: number;
  maxFixRetries?: number;
  scoreThreshold?: number;
  workerTimeout?: number;
}

export interface BatchReport {
  batchId: number;
  testCases: string[];
  score: number;
  status: 'passed' | 'failed' | 'partial' | 'escalated';
  findings: string[];
  timestamp: string;
}

export interface OrchestratorSummary {
  totalBatches: number;
  passedBatches: number;
  failedBatches: number;
  escalatedBatches: number;
  overallScore: number;
  batchReports: BatchReport[];
  timestamp: string;
}

export const DEFAULT_CONFIG: Required<OrchestratorConfig> = {
  batchSize: 3,
  maxFixRetries: 3,
  scoreThreshold: 85,
  workerTimeout: 300,
};

const CONFIG_LIMITS = {
  batchSize: { min: 1, max: 1000 },
  maxFixRetries: { min: 0, max: 20 },
  scoreThreshold: { min: 0, max: 100 },
  workerTimeout: { min: 1, max: 3600 },
} as const;

type ConfigKey = keyof Required<OrchestratorConfig>;

interface WorkerInvocation {
  skill: string;
  batchId: number;
  testCaseId: string;
}

interface WorkerResult {
  skill: string;
  status: 'passed' | 'failed' | 'escalated';
  batchId: number;
  testCaseId: string;
  timestamp: string;
  findings: string[];
  recommendations: string[];
  metrics: Record<string, number>;
  nextSkill: string;
}

interface BenchmarkSummary {
  weightedScore: number;
  fixSuggestions: string[];
}

interface GeneratedTestCasesResult {
  testCases: unknown[];
}

type DispatchParallelFn = (invocations: WorkerInvocation[], skillsDir: string) => WorkerResult[];
type CalculateBenchmarkFn = (workspacePath: string) => BenchmarkSummary;

interface TimedDispatchOutcome {
  results: WorkerResult[];
  timedOut: boolean;
}

function validateIntegerConfig(name: ConfigKey, value: number): number {
  const limits = CONFIG_LIMITS[name];
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < limits.min || value > limits.max) {
    throw new RangeError(
      `Invalid ${name}: expected a finite integer between ${limits.min} and ${limits.max}, got ${String(value)}`,
    );
  }
  return value;
}

function resolveConfig(config: OrchestratorConfig): Required<OrchestratorConfig> {
  return {
    batchSize: validateIntegerConfig('batchSize', config.batchSize ?? DEFAULT_CONFIG.batchSize),
    maxFixRetries: validateIntegerConfig('maxFixRetries', config.maxFixRetries ?? DEFAULT_CONFIG.maxFixRetries),
    scoreThreshold: validateIntegerConfig('scoreThreshold', config.scoreThreshold ?? DEFAULT_CONFIG.scoreThreshold),
    workerTimeout: validateIntegerConfig('workerTimeout', config.workerTimeout ?? DEFAULT_CONFIG.workerTimeout),
  };
}

function dispatchWithTimeout(
  dispatchParallel: DispatchParallelFn,
  invocations: WorkerInvocation[],
  skillsDir: string,
  workerTimeoutSeconds: number,
): TimedDispatchOutcome {
  const startedAtMs = Date.now();
  const results = dispatchParallel(invocations, skillsDir);
  const elapsedMs = Date.now() - startedAtMs;
  const timeoutMs = workerTimeoutSeconds * 1000;

  if (elapsedMs <= timeoutMs) {
    return { results, timedOut: false };
  }

  const timeoutFinding = `Worker timeout exceeded (${workerTimeoutSeconds}s) after ${elapsedMs}ms`;
  const timedOutResults: WorkerResult[] = invocations.map((invocation, index) => {
    const existing = results[index];
    const findings = Array.isArray(existing?.findings) ? existing.findings : [];
    const recommendations = Array.isArray(existing?.recommendations) ? existing.recommendations : [];

    return {
      skill: existing?.skill ?? invocation.skill,
      status: 'failed',
      batchId: invocation.batchId,
      testCaseId: invocation.testCaseId,
      timestamp: existing?.timestamp ?? new Date().toISOString(),
      findings: [...findings, timeoutFinding],
      recommendations: recommendations.length > 0
        ? recommendations
        : ['Increase worker timeout or reduce batch complexity'],
      metrics: {
        ...(existing?.metrics ?? {}),
        elapsedMs,
        timeoutSeconds: workerTimeoutSeconds,
      },
      nextSkill: existing?.nextSkill ?? 'fixer',
    };
  });

  return { results: timedOutResults, timedOut: true };
}

function mergeWorkerResults(currentResults: WorkerResult[], updates: WorkerResult[]): WorkerResult[] {
  const byTestCaseId = new Map<string, WorkerResult>();

  currentResults.forEach((result) => byTestCaseId.set(result.testCaseId, result));
  updates.forEach((result) => byTestCaseId.set(result.testCaseId, result));

  return Array.from(byTestCaseId.values());
}

function parseIntegerArg(flag: string, rawValue: string | undefined): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid value for ${flag}: expected an integer, got "${rawValue}"`);
  }

  return value;
}

export function splitIntoBatches(items: string[], batchSize: number = DEFAULT_CONFIG.batchSize): string[][] {
  if (items.length === 0) return [];
  const safeBatchSize = validateIntegerConfig('batchSize', batchSize);

  const batches: string[][] = [];
  for (let i = 0; i < items.length; i += safeBatchSize) {
    batches.push(items.slice(i, i + safeBatchSize));
  }
  return batches;
}

export function createBatchDirectory(baseDir: string, batchId: number): string {
  const batchDir = path.join(baseDir, `batch-${String(batchId).padStart(2, '0')}`);
  fs.mkdirSync(batchDir, { recursive: true });
  return batchDir;
}

export function getBatchDirectory(baseDir: string, batchId: number): string {
  return path.join(baseDir, `batch-${String(batchId).padStart(2, '0')}`);
}

export function createTestCaseDirectory(batchDir: string, testCaseId: string): string {
  const tcDir = path.join(batchDir, testCaseId);
  fs.mkdirSync(tcDir, { recursive: true });
  return tcDir;
}

export interface BatchLifecycleResult {
  totalBatches: number;
  passedBatches: number;
  failedBatches: number;
  escalatedBatches: number;
  overallScore: number;
  batchReports: BatchReport[];
  timestamp: string;
}

export function runBatchLifecycle(
  workspacePath: string,
  config: OrchestratorConfig = {},
): BatchLifecycleResult {
  const resolvedConfig = resolveConfig(config);

  const ws = path.resolve(workspacePath);
  const iterationDir = path.join(ws, '.agents', 'iteration');
  fs.mkdirSync(iterationDir, { recursive: true });

  const { generateTestCases } = require('./generate-tests') as {
    generateTestCases: (workspacePath: string) => GeneratedTestCasesResult;
  };
  const { dispatchParallel } = require('./dispatch') as {
    dispatchParallel: DispatchParallelFn;
  };
  const { calculateBenchmark } = require('./benchmark') as {
    calculateBenchmark: CalculateBenchmarkFn;
  };

  const testCasesResult = generateTestCases(ws);
  const testCaseIds = testCasesResult.testCases.map((_: unknown, i: number) => `tc-${String(i + 1).padStart(3, '0')}`);

  const batches = splitIntoBatches(testCaseIds, resolvedConfig.batchSize);

  const batchReports: BatchReport[] = [];
  let passedBatches = 0;
  let failedBatches = 0;
  let escalatedBatches = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchId = batchIdx + 1;
    const batchDir = createBatchDirectory(iterationDir, batchId);
    const batchTestCases = batches[batchIdx];

    const invocations = batchTestCases.map((tcId: string) => ({
      skill: 'worker',
      batchId,
      testCaseId: tcId,
    }));

    const skillsDir = path.join(ws, '.agents', 'skills', 'workspace-maxxing', 'skills');
    const workerDispatch = dispatchWithTimeout(
      dispatchParallel,
      invocations,
      skillsDir,
      resolvedConfig.workerTimeout,
    );
    const workerResults = workerDispatch.results;

    workerResults.forEach((result) => {
      const tcDir = createTestCaseDirectory(batchDir, result.testCaseId);
      fs.writeFileSync(
        path.join(tcDir, 'report.json'),
        JSON.stringify(result, null, 2),
      );
    });

    const benchmarkResult = calculateBenchmark(ws);
    const batchScore = benchmarkResult.weightedScore;
    const hasWorkerFailures = workerResults.some((result) => result.status !== 'passed');

    let batchStatus: BatchReport['status'] = 'passed';
    if (batchScore < resolvedConfig.scoreThreshold || hasWorkerFailures) {
      const fixResults = runFixLoop(
        workerResults,
        benchmarkResult.fixSuggestions,
        resolvedConfig.maxFixRetries,
        resolvedConfig.scoreThreshold,
        ws,
        resolvedConfig.workerTimeout,
        batchScore,
        dispatchParallel,
        calculateBenchmark,
        workerDispatch.timedOut
          ? [`Worker timeout exceeded (${resolvedConfig.workerTimeout}s) during worker dispatch`]
          : [],
      );

      if (fixResults.status === 'escalated') {
        batchStatus = 'escalated';
        escalatedBatches++;
      } else if (fixResults.status === 'failed') {
        batchStatus = 'failed';
        failedBatches++;
      } else {
        batchStatus = 'passed';
        passedBatches++;
      }

      const postFixBenchmark = calculateBenchmark(ws);
      batchReports.push({
        batchId,
        testCases: batchTestCases,
        score: postFixBenchmark.weightedScore,
        status: batchStatus,
        findings: fixResults.findings,
        timestamp: new Date().toISOString(),
      });
    } else {
      passedBatches++;
      batchReports.push({
        batchId,
        testCases: batchTestCases,
        score: batchScore,
        status: 'passed',
        findings: ['Batch passed threshold'],
        timestamp: new Date().toISOString(),
      });
    }
  }

  const summary: BatchLifecycleResult = {
    totalBatches: batches.length,
    passedBatches,
    failedBatches,
    escalatedBatches,
    overallScore: batchReports.length > 0
      ? Math.round(batchReports.reduce((sum, r) => sum + r.score, 0) / batchReports.length)
      : 0,
    batchReports,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(iterationDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
  );

  return summary;
}

interface FixLoopResult {
  status: 'passed' | 'failed' | 'escalated';
  findings: string[];
}

function runFixLoop(
  workerResults: WorkerResult[],
  fixSuggestions: string[],
  maxRetries: number,
  scoreThreshold: number,
  workspacePath: string,
  workerTimeout: number,
  initialScore: number,
  dispatchParallel: DispatchParallelFn,
  calculateBenchmark: CalculateBenchmarkFn,
  initialFindings: string[] = [],
): FixLoopResult {
  const findings: string[] = [...initialFindings];
  let currentResults = [...workerResults];
  let latestScore = initialScore;

  if (fixSuggestions.length > 0) {
    findings.push(`Fix suggestions: ${fixSuggestions.join('; ')}`);
  }

  for (let retry = 0; retry < maxRetries; retry++) {
    const failingResults = currentResults.filter((r) => r.status !== 'passed');

    if (failingResults.length === 0) {
      if (latestScore >= scoreThreshold) {
        return { status: 'passed', findings };
      }

      return {
        status: 'failed',
        findings: [
          ...findings,
          `No failing worker outputs remain, but score ${latestScore} is below threshold ${scoreThreshold}`,
        ],
      };
    }

    const fixInvocations = failingResults.map((r) => ({
      skill: 'fixer',
      batchId: r.batchId,
      testCaseId: r.testCaseId,
    }));

    const skillsDir = path.join(workspacePath, '.agents', 'skills', 'workspace-maxxing', 'skills');
    const fixDispatch = dispatchWithTimeout(
      dispatchParallel,
      fixInvocations,
      skillsDir,
      workerTimeout,
    );
    const fixResults = fixDispatch.results;
    currentResults = mergeWorkerResults(currentResults, fixResults);

    findings.push(`Fix attempt ${retry + 1}: ${fixResults.length} fixes applied`);
    if (fixDispatch.timedOut) {
      findings.push(`Worker timeout exceeded (${workerTimeout}s) during fix attempt ${retry + 1}`);
    }

    const benchmarkResult = calculateBenchmark(workspacePath);
    latestScore = benchmarkResult.weightedScore;
    if (latestScore >= scoreThreshold && currentResults.every((result) => result.status === 'passed')) {
      return { status: 'passed', findings };
    }
  }

  if (currentResults.every((result) => result.status === 'passed')) {
    return {
      status: 'failed',
      findings: [
        ...findings,
        `No failing worker outputs remain, but score ${latestScore} is below threshold ${scoreThreshold}`,
      ],
    };
  }

  return { status: 'escalated', findings: [...findings, 'Max retries exhausted'] };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const workspace = parseArg('--workspace');
  const batchSizeStr = parseArg('--batch-size');
  const scoreThresholdStr = parseArg('--score-threshold');
  const maxFixRetriesStr = parseArg('--max-fix-retries');
  const workerTimeoutStr = parseArg('--worker-timeout');

  if (!workspace) {
    console.error('Usage: node orchestrator.ts --workspace <path> [--batch-size <n>] [--score-threshold <n>] [--max-fix-retries <n>] [--worker-timeout <s>]');
    process.exit(1);
  }

  const config: OrchestratorConfig = {};
  try {
    const batchSize = parseIntegerArg('--batch-size', batchSizeStr);
    const scoreThreshold = parseIntegerArg('--score-threshold', scoreThresholdStr);
    const maxFixRetries = parseIntegerArg('--max-fix-retries', maxFixRetriesStr);
    const workerTimeout = parseIntegerArg('--worker-timeout', workerTimeoutStr);

    if (batchSize !== undefined) config.batchSize = batchSize;
    if (scoreThreshold !== undefined) config.scoreThreshold = scoreThreshold;
    if (maxFixRetries !== undefined) config.maxFixRetries = maxFixRetries;
    if (workerTimeout !== undefined) config.workerTimeout = workerTimeout;

    const summary = runBatchLifecycle(workspace, config);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

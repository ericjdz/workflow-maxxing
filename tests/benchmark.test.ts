import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { calculateBenchmark, formatBenchmarkTable, saveBenchmarkReport, BenchmarkResult } from '../src/scripts/benchmark';

describe('calculateBenchmark', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'benchmark-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createStage(ws: string, name: string, content: string) {
    const dir = path.join(ws, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'CONTEXT.md'), content);
  }

  it('returns weighted scores for a workspace with all stages', () => {
    createStage(tempDir, '01-ideation', '## Purpose\nTest\n\n## Inputs\nNone\n\n## Outputs\nTest\n\n## Dependencies\nNone');
    createStage(tempDir, '02-research', '## Purpose\nTest\n\n## Inputs\nNone\n\n## Outputs\nTest\n\n## Dependencies\nNone');
    createStage(tempDir, '03-architecture', '## Purpose\nTest\n\n## Inputs\nNone\n\n## Outputs\nTest\n\n## Dependencies\nNone');

    const result = calculateBenchmark(tempDir);

    expect(result.stages).toHaveLength(3);
    expect(result.stages[0].name).toBe('01-ideation');
    expect(result.stages[0].weight).toBe(1.5);
    expect(result.stages[1].name).toBe('02-research');
    expect(result.stages[1].weight).toBe(1.3);
    expect(result.stages[2].name).toBe('03-architecture');
    expect(result.stages[2].weight).toBe(1.2);
  });

  it('excludes missing stages from calculation', () => {
    createStage(tempDir, '01-ideation', '## Purpose\nTest\n\n## Inputs\nNone\n\n## Outputs\nTest\n\n## Dependencies\nNone');

    const result = calculateBenchmark(tempDir);

    expect(result.stages).toHaveLength(1);
    expect(result.stages[0].name).toBe('01-ideation');
  });

  it('normalizes final score to 0-100', () => {
    createStage(tempDir, '01-ideation', '## Purpose\nTest\n\n## Inputs\nNone\n\n## Outputs\nTest\n\n## Dependencies\nNone');

    const result = calculateBenchmark(tempDir);

    expect(result.weightedScore).toBeGreaterThanOrEqual(0);
    expect(result.weightedScore).toBeLessThanOrEqual(100);
  });

  it('returns empty stages for workspace with no numbered folders', () => {
    fs.mkdirSync(path.join(tempDir, '00-meta'), { recursive: true });

    const result = calculateBenchmark(tempDir);

    expect(result.stages).toHaveLength(0);
    expect(result.weightedScore).toBe(0);
  });

  it('returns empty stages for non-existent workspace', () => {
    const result = calculateBenchmark('/non-existent-path-xyz');

    expect(result.stages).toHaveLength(0);
    expect(result.weightedScore).toBe(0);
  });

  it('generates fix suggestions for incomplete stages', () => {
    createStage(tempDir, '01-ideation', 'minimal content');

    const result = calculateBenchmark(tempDir);

    expect(result.fixSuggestions.length).toBeGreaterThan(0);
    expect(result.improvementPotential).toBe(true);
  });
});

describe('formatBenchmarkTable', () => {
  it('formats a benchmark result as a console table', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [
        { name: '01-ideation', raw: 85, weight: 1.5, weighted: 95 },
        { name: '02-research', raw: 60, weight: 1.3, weighted: 58 },
      ],
      fixSuggestions: ['Add research sources'],
      improvementPotential: true,
    };

    const table = formatBenchmarkTable(data);

    expect(table).toContain('01-ideation');
    expect(table).toContain('02-research');
    expect(table).toContain('78');
    expect(table).toContain('TOTAL');
  });

  it('handles empty stages gracefully', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 0,
      weightedScore: 0,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    };

    const table = formatBenchmarkTable(data);

    expect(table).toContain('0');
  });
});

describe('saveBenchmarkReport', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'benchmark-report-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('saves benchmark report to .workspace-benchmarks directory', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    };

    const filePath = saveBenchmarkReport(tempDir, data);

    expect(filePath).toContain('.workspace-benchmarks');
    expect(filePath).toContain('test-ws-');
    expect(fs.existsSync(filePath)).toBe(true);

    const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(saved.weightedScore).toBe(78);
    expect(saved.workspace).toBe('test-ws');
  });
});

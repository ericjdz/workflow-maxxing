import * as fs from 'fs';
import * as path from 'path';

export interface StageBenchmark {
  name: string;
  raw: number;
  weight: number;
  weighted: number;
}

export interface BenchmarkResult {
  workspace: string;
  agent: string;
  timestamp: string;
  rawScore: number;
  weightedScore: number;
  stages: StageBenchmark[];
  fixSuggestions: string[];
  improvementPotential: boolean;
}

const STAGE_WEIGHTS: Record<string, number> = {
  '01-ideation': 1.5,
  '02-research': 1.3,
  '03-architecture': 1.2,
};

const DEFAULT_WEIGHT = 1.0;
const MAX_RAW_SCORE = 45;

export function calculateBenchmark(workspacePath: string): BenchmarkResult {
  const ws = path.resolve(workspacePath);
  const stageFolders = getNumberedFolders(ws);

  const stages: StageBenchmark[] = [];
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const folder of stageFolders) {
    const weight = STAGE_WEIGHTS[folder] ?? DEFAULT_WEIGHT;
    const raw = calculateStageRawScore(ws, folder);
    const weighted = (raw / MAX_RAW_SCORE) * 100 * weight;

    stages.push({ name: folder, raw, weight, weighted });
    totalWeighted += weighted;
    totalWeight += weight;
  }

  const weightedScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;
  const rawScore = stages.reduce((sum, s) => sum + s.raw, 0);

  const fixSuggestions = stages
    .filter((s) => s.raw < MAX_RAW_SCORE)
    .map((s) => `Improve ${s.name}: current score ${s.raw}/${MAX_RAW_SCORE}`);

  return {
    workspace: path.basename(ws),
    agent: 'unknown',
    timestamp: new Date().toISOString(),
    rawScore,
    weightedScore: Math.min(Math.round(weightedScore), 100),
    stages,
    fixSuggestions,
    improvementPotential: stages.some((s) => s.raw < MAX_RAW_SCORE),
  };
}

export function formatBenchmarkTable(data: BenchmarkResult): string {
  const lines: string[] = [];

  lines.push(`\nBenchmark Report: ${data.workspace}`);
  lines.push(`Agent: ${data.agent} | Timestamp: ${data.timestamp}`);
  lines.push('');
  lines.push(
    padRight('Stage', 20) +
    padRight('Raw', 8) +
    padRight('Weight', 10) +
    padRight('Weighted', 12)
  );
  lines.push('-'.repeat(50));

  for (const stage of data.stages) {
    lines.push(
      padRight(stage.name, 20) +
      padRight(String(stage.raw), 8) +
      padRight(stage.weight.toFixed(1) + 'x', 10) +
      padRight(stage.weighted.toFixed(1), 12)
    );
  }

  lines.push('-'.repeat(50));
  lines.push(
    padRight('TOTAL', 20) +
    padRight(String(data.rawScore), 8) +
    padRight('', 10) +
    padRight(data.weightedScore.toFixed(1), 12)
  );
  lines.push('');

  if (data.fixSuggestions.length > 0) {
    lines.push('Suggestions:');
    for (const suggestion of data.fixSuggestions) {
      lines.push(`  - ${suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function saveBenchmarkReport(workspacePath: string, data: BenchmarkResult): string {
  const reportDir = path.join(workspacePath, '.workspace-benchmarks');
  fs.mkdirSync(reportDir, { recursive: true });

  const filename = `${data.workspace}-${data.timestamp.replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(reportDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

function calculateStageRawScore(ws: string, folder: string): number {
  const stageContextPath = path.join(ws, folder, 'CONTEXT.md');
  let score = 0;

  if (fs.existsSync(stageContextPath)) {
    const content = fs.readFileSync(stageContextPath, 'utf-8');
    if (/^#+\s+Purpose/im.test(content)) score += 4;
    if (/^#+\s+Input/im.test(content)) score += 4;
    if (/^#+\s+Output/im.test(content)) score += 4;
    if (/^#+\s+Dependenc/im.test(content)) score += 3;
    if (/^#+\s+Success Criteria/im.test(content)) score += 5;
    if (/^#+\s+Approach/im.test(content)) score += 5;
    if (/^#+\s+Risks/im.test(content)) score += 5;
    if (/^#+\s+Timeline/im.test(content)) score += 5;
    if (/^#+\s+Resources/im.test(content)) score += 5;
    if (/^#+\s+Validation/im.test(content)) score += 5;
  }

  return Math.min(score, MAX_RAW_SCORE);
}

function getNumberedFolders(workspacePath: string): string[] {
  if (!fs.existsSync(workspacePath)) return [];
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name) && e.name !== '00-meta')
    .map((e) => e.name);
}

function padRight(str: string, length: number): string {
  return str.padEnd(length);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const workspace = parseArg('--workspace');

  if (!workspace) {
    console.error('Usage: node benchmark.ts --workspace <path>');
    process.exit(1);
  }

  const result = calculateBenchmark(workspace);
  console.log(formatBenchmarkTable(result));
}

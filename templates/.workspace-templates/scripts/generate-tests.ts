import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  id: string;
  stage: string;
  type: 'sample' | 'edge-case' | 'empty';
  input: string;
  expected: string;
}

export type TestCasesOutput = TestCase[];

export function generateTestCases(
  workspacePath: string,
  outputPath?: string,
): TestCasesOutput {
  const ws = path.resolve(workspacePath);
  const testCases: TestCase[] = [];
  const workspaceDomain = detectWorkspaceDomain(ws);

  const stageFolders = getNumberedFolders(ws);

  if (stageFolders.length === 0) {
    console.warn('Warning: No numbered stage folders found in workspace');
  }

  for (const stage of stageFolders) {
    const contextPath = path.join(ws, stage, 'CONTEXT.md');
    let purpose = '';
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const purposeMatch = content.match(/## Purpose\n([\s\S]*?)(?=##|$)/i);
      if (purposeMatch) {
        purpose = purposeMatch[1].trim();
      }
    }

    testCases.push({
      id: `${stage}-sample`,
      stage,
      type: 'sample',
      input: generateSampleInput(stage, purpose, workspaceDomain),
      expected: `Stage should fulfill its purpose: ${purpose || 'handle stage-specific processing'}`,
    });

    testCases.push({
      id: `${stage}-edge-case`,
      stage,
      type: 'edge-case',
      input: generateEdgeCaseInput(stage, workspaceDomain),
      expected: `Stage should handle edge case gracefully`,
    });

    testCases.push({
      id: `${stage}-empty`,
      stage,
      type: 'empty',
      input: '',
      expected: `Stage should handle empty input gracefully`,
    });
  }

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(testCases, null, 2));
    console.log(`Test cases written to: ${outputPath}`);
  }

  return testCases;
}

function generateSampleInput(stage: string, purpose: string, domain: string): string {
  if (domain === 'sports-prediction') {
    const sportsSamples: Record<string, string> = {
      '01-input': 'Barcelona vs Real Madrid next match prediction request with team form and injury notes',
      '02-process': 'UCL finals winner prediction using recent xG, head-to-head history, and squad availability',
      '03-output': 'Liverpool vs Arsenal game prediction with confidence score and rationale summary',
    };

    return sportsSamples[stage] || `Sports match outcome prediction scenario for ${stage}`;
  }

  const samples: Record<string, string> = {
    '01-input': 'A sample input document with valid data for processing',
    '02-process': 'Processed data from the input stage ready for transformation',
    '03-output': 'Final processed data ready for report generation',
  };
  return samples[stage] || `Sample data for ${stage}`;
}

function generateEdgeCaseInput(stage: string, domain: string): string {
  if (domain === 'sports-prediction') {
    const sportsEdgeCases: Record<string, string> = {
      '01-input': 'Barcelona vs Real Madrid request missing kickoff date and missing expected league context',
      '02-process': 'UCL finals winner scenario with conflicting bookmaker odds and incomplete player availability data',
      '03-output': 'Liverpool vs Arsenal prediction where confidence exceeds bounds and explanation is inconsistent',
    };

    return sportsEdgeCases[stage] || `Sports prediction edge case data for ${stage}`;
  }

  const edgeCases: Record<string, string> = {
    '01-input': 'Input with special characters: <>&"\' and very long text that exceeds normal length expectations',
    '02-process': 'Data with missing fields and inconsistent formatting',
    '03-output': 'Conflicting output requirements from upstream stages',
  };
  return edgeCases[stage] || `Edge case data for ${stage}`;
}

function detectWorkspaceDomain(workspacePath: string): string {
  const filesToScan = ['SYSTEM.md', 'CONTEXT.md'];
  const textChunks: string[] = [];

  for (const fileName of filesToScan) {
    const filePath = path.join(workspacePath, fileName);
    if (fs.existsSync(filePath)) {
      textChunks.push(fs.readFileSync(filePath, 'utf-8'));
    }
  }

  const stageFolders = getNumberedFolders(workspacePath);
  for (const stage of stageFolders) {
    const contextPath = path.join(workspacePath, stage, 'CONTEXT.md');
    if (fs.existsSync(contextPath)) {
      textChunks.push(fs.readFileSync(contextPath, 'utf-8'));
    }
  }

  const corpus = textChunks.join('\n').toLowerCase();
  const sportsPredictionMatch = /(football|soccer|ucl|champions league|match prediction|sports prediction|game prediction)/i.test(corpus);

  return sportsPredictionMatch ? 'sports-prediction' : 'generic';
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
  const output = parseArg('--output');

  if (!workspace) {
    console.error('Usage: node generate-tests.ts --workspace <path> [--output <path>]');
    process.exit(1);
  }

  generateTestCases(workspace, output);
}

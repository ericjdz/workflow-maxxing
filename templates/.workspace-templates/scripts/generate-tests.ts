import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  stage: string;
  type: 'sample' | 'edge-case' | 'empty';
  input: string;
  expected: string;
}

export interface TestCasesOutput {
  testCases: TestCase[];
}

export function generateTestCases(
  workspacePath: string,
  outputPath?: string,
): TestCasesOutput {
  const ws = path.resolve(workspacePath);
  const testCases: TestCase[] = [];

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
      stage,
      type: 'sample',
      input: generateSampleInput(stage, purpose),
      expected: `Stage should fulfill its purpose: ${purpose || 'handle stage-specific processing'}`,
    });

    testCases.push({
      stage,
      type: 'edge-case',
      input: generateEdgeCaseInput(stage),
      expected: `Stage should handle edge case gracefully`,
    });

    testCases.push({
      stage,
      type: 'empty',
      input: '',
      expected: `Stage should handle empty input gracefully`,
    });
  }

  const result: TestCasesOutput = { testCases };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Test cases written to: ${outputPath}`);
  }

  return result;
}

function generateSampleInput(stage: string, purpose: string): string {
  const samples: Record<string, string> = {
    '01-input': 'A sample input document with valid data for processing',
    '02-process': 'Processed data from the input stage ready for transformation',
    '03-output': 'Final processed data ready for report generation',
  };
  return samples[stage] || `Sample data for ${stage}`;
}

function generateEdgeCaseInput(stage: string): string {
  const edgeCases: Record<string, string> = {
    '01-input': 'Input with special characters: <>&"\' and very long text that exceeds normal length expectations',
    '02-process': 'Data with missing fields and inconsistent formatting',
    '03-output': 'Conflicting output requirements from upstream stages',
  };
  return edgeCases[stage] || `Edge case data for ${stage}`;
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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateTestCases, TestCase } from '../src/scripts/generate-tests';

describe('generate-tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-tests-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createWorkspaceWithStages(stageNames: string[]): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), `# Test\n\n## Folder Map\n\n${stageNames.map((s) => `- \`${s}/\``).join('\n')}\n`);
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), `# Router\n\n## Routing Table\n\n${stageNames.map((s) => `- \`${s}/\``).join('\n')}\n`);

    for (const stage of stageNames) {
      const stageDir = path.join(ws, stage);
      fs.mkdirSync(stageDir, { recursive: true });
      fs.writeFileSync(path.join(stageDir, 'CONTEXT.md'), `# ${stage}\n\n## Purpose\nTest stage\n\n## Inputs\nRaw data\n\n## Outputs\nProcessed data\n\n## Dependencies\nNone\n`);
    }

    return ws;
  }

  describe('generateTestCases', () => {
    it('generates test cases for each stage', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-process', '03-output']);
      const result = generateTestCases(ws);

      const stages = [...new Set(result.testCases.map((tc) => tc.stage))];
      expect(stages).toContain('01-input');
      expect(stages).toContain('02-process');
      expect(stages).toContain('03-output');
    });

    it('generates 2-3 test cases per stage', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-process']);
      const result = generateTestCases(ws);

      const inputCases = result.testCases.filter((tc) => tc.stage === '01-input');
      const processCases = result.testCases.filter((tc) => tc.stage === '02-process');

      expect(inputCases.length).toBeGreaterThanOrEqual(2);
      expect(inputCases.length).toBeLessThanOrEqual(3);
      expect(processCases.length).toBeGreaterThanOrEqual(2);
      expect(processCases.length).toBeLessThanOrEqual(3);
    });

    it('includes sample, edge-case, and empty test types', () => {
      const ws = createWorkspaceWithStages(['01-input']);
      const result = generateTestCases(ws);

      const types = result.testCases.map((tc) => tc.type);
      expect(types).toContain('sample');
      expect(types).toContain('edge-case');
      expect(types).toContain('empty');
    });

    it('returns empty test cases for workspace with no stages', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');

      const result = generateTestCases(ws);

      expect(result.testCases).toHaveLength(0);
    });

    it('each test case has required fields', () => {
      const ws = createWorkspaceWithStages(['01-input']);
      const result = generateTestCases(ws);

      for (const tc of result.testCases) {
        expect(tc).toHaveProperty('stage');
        expect(tc).toHaveProperty('type');
        expect(tc).toHaveProperty('input');
        expect(tc).toHaveProperty('expected');
      }
    });

    it('writes valid JSON to output file', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-output']);
      const outputPath = path.join(tempDir, 'tests.json');

      generateTestCases(ws, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('testCases');
      expect(Array.isArray(parsed.testCases)).toBe(true);
    });
  });
});

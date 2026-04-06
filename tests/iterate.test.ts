import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { iterateWorkspace, IterateResult, scoreWorkspace, runChecklist } from '../src/scripts/iterate';
import * as validate from '../src/scripts/validate';

jest.mock('../src/scripts/validate');

describe('iterate', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iterate-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  function createBasicWorkspace(): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nWorkspace role\n\n## Folder Map\n\n- `01-input/`\n- `02-output/`\n\n## Rules\nICM rules\n');
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/` → `01-input/CONTEXT.md`\n- `02-output/` → `02-output/CONTEXT.md`\n');
    fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
    fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\n## Purpose\nInput stage\n\n## Inputs\nRaw data\n\n## Outputs\nValidated data\n\n## Dependencies\nNone\n');
    fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
    fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), '# 02-output\n\n## Purpose\nOutput stage\n\n## Inputs\nProcessed data\n\n## Outputs\nFinal report\n\n## Dependencies\n01-input\n');
    fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
    fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tool Inventory\n\n## Installed Tools\n\n| Tool | Version | Manager | Installed |\n|------|---------|---------|-----------|\n| — | — | — | — |\n');
    fs.writeFileSync(path.join(ws, 'README.md'), '# Test Workspace\n\n## Usage\nFollow stages in order.\n');
    return ws;
  }

  describe('iterateWorkspace', () => {
    it('passes all three passes on a good workspace', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 3 });

      expect(result.passes.validate.status).toBe('passed');
      expect(result.passes.score.score).toBeGreaterThan(0);
      expect(result.passes.checklist.items).toBeGreaterThan(0);
      expect(result.escalate).toBe(false);
    });

    it('retries validation failures up to maxRetries', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock)
        .mockReturnValueOnce({ passed: false, checks: [{ name: 'SYSTEM.md exists', passed: false, message: 'Missing' }] })
        .mockReturnValueOnce({ passed: true, checks: [] });

      const result = iterateWorkspace(ws, { maxRetries: 3 });

      expect(result.passes.validate.retries).toBe(1);
      expect(result.passes.validate.status).toBe('passed');
    });

    it('escalates when validation fails after max retries', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: false,
        checks: [{ name: 'SYSTEM.md exists', passed: false, message: 'Missing' }],
      });

      const result = iterateWorkspace(ws, { maxRetries: 2 });

      expect(result.escalate).toBe(true);
      expect(result.passes.validate.status).toBe('escalated');
      expect(result.passes.validate.retries).toBe(2);
    });

    it('returns score with improvements for low-quality workspace', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Minimal\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');
      fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
      fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tools\n');

      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1 });

      expect(result.passes.score.score).toBeLessThan(80);
      expect(result.passes.score.improvements.length).toBeGreaterThan(0);
    });

    it('checklist reports pass/fail per item', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1 });

      expect(result.passes.checklist.items).toBe(result.passes.checklist.passed + result.passes.checklist.failed);
    });
  });

  describe('scoreWorkspace', () => {
    it('scores a perfect workspace 100', () => {
      const ws = createBasicWorkspace();
      const score = scoreWorkspace(ws);

      expect(score.total).toBe(85);
      expect(score.improvements).toHaveLength(0);
    });

    it('deducts points for missing SYSTEM.md sections', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Minimal\n');

      const score = scoreWorkspace(ws);

      expect(score.system).toBeLessThan(20);
    });

    it('deducts points for missing CONTEXT.md routing', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');

      const score = scoreWorkspace(ws);

      expect(score.context).toBeLessThan(20);
    });

    it('deducts points for incomplete stage CONTEXT.md', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');

      const score = scoreWorkspace(ws);

      expect(score.stages).toBeLessThan(15);
    });

    it('deducts points for missing tools.md', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nRole\n\n## Folder Map\n\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n');

      const score = scoreWorkspace(ws);

      expect(score.tools).toBe(0);
    });
  });

  describe('runChecklist', () => {
    it('passes all items on a complete workspace', () => {
      const ws = createBasicWorkspace();
      const result = runChecklist(ws);

      expect(result.failed).toBe(0);
      expect(result.passed).toBe(result.items);
    });

    it('fails items for incomplete stages', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');
      fs.writeFileSync(path.join(ws, 'README.md'), '# README\n');

      const result = runChecklist(ws);

      expect(result.failed).toBeGreaterThan(0);
    });
  });

  describe('benchmark integration', () => {
    it('includes benchmark data in result', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1 });

      expect(result.benchmark).toBeDefined();
      expect(result.benchmark?.stages.length).toBeGreaterThan(0);
      expect(result.benchmark?.weightedScore).toBeGreaterThanOrEqual(0);
      expect(result.benchmark?.weightedScore).toBeLessThanOrEqual(100);
    });

    it('passes agent flag to benchmark result', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1, agent: 'claude' });

      expect(result.benchmark?.agent).toBe('claude');
    });
  });
});

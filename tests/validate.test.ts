import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateWorkspace, ValidationResult } from '../src/scripts/validate';

describe('validate', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createValidWorkspace(): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });

    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n- `02-output/`\n');
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
    fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
    fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\nContent here.\n');
    fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
    fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), '# 02-output\n\nContent here.\n');
    fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
    fs.writeFileSync(path.join(ws, '00-meta', 'CONTEXT.md'), '# 00-meta\n\nMeta content.\n');
    fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tools\n\n| Tool | Version |\n|------|---------|\n');

    return ws;
  }

  describe('validateWorkspace', () => {
    it('passes for a valid workspace', () => {
      const ws = createValidWorkspace();
      const result = validateWorkspace(ws);

      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it('fails if SYSTEM.md is missing', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, 'SYSTEM.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const systemCheck = result.checks.find((c) => c.name === 'SYSTEM.md exists');
      expect(systemCheck?.passed).toBe(false);
    });

    it('fails if SYSTEM.md has no folder map', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\nNo directory listing here.\n');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('folder map'));
      expect(check?.passed).toBe(false);
    });

    it('fails if CONTEXT.md is missing at root', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, 'CONTEXT.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('CONTEXT.md exists'));
      expect(check?.passed).toBe(false);
    });

    it('fails if a numbered folder is missing CONTEXT.md', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, '01-input', 'CONTEXT.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name === '01-input/CONTEXT.md exists');
      expect(check?.passed).toBe(false);
    });

    it('fails if a CONTEXT.md is empty', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name === '01-input/CONTEXT.md is not empty');
      expect(check?.passed).toBe(false);
    });

    it('fails if duplicate content exists across files', () => {
      const ws = createValidWorkspace();
      const duplicateText = 'This is a long duplicate text block that appears in multiple files and should be flagged as a potential duplicate content issue for testing purposes.';
      fs.appendFileSync(path.join(ws, '01-input', 'CONTEXT.md'), duplicateText);
      fs.appendFileSync(path.join(ws, '02-output', 'CONTEXT.md'), duplicateText);

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('duplicate'));
      expect(check?.passed).toBe(false);
    });

    it('returns structured output with all check names', () => {
      const ws = createValidWorkspace();
      const result = validateWorkspace(ws);

      const checkNames = result.checks.map((c) => c.name);
      expect(checkNames).toContain('SYSTEM.md exists');
      expect(checkNames).toContain('CONTEXT.md exists at root');
    });
  });
});

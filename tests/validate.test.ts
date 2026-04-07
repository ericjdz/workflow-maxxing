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

    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), [
      '# Test',
      '',
      '## Role',
      'Workspace role.',
      '',
      '## Folder Map',
      '- `01-input/`',
      '- `02-output/`',
      '',
      '## Workflow Rules',
      'Follow selective loading and canonical source rules.',
      '',
      '## Stage Boundaries',
      'One-way dependencies only.',
      '',
      '## Tooling Policy',
      'Use tools.md for inventory.',
      '',
    ].join('\n'));

    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), [
      '# Router',
      '',
      '## How to Use This File',
      'Route tasks by stage.',
      '',
      '## Task Routing',
      '- 01-input/CONTEXT.md',
      '- 02-output/CONTEXT.md',
      '',
      '## Loading Order',
      '1. SYSTEM.md',
      '2. CONTEXT.md',
      '3. Stage CONTEXT.md',
      '4. Only the task files needed',
      '',
      '## Stage Handoff Routing',
      '01-input -> 02-output',
      '',
      '## Escalation',
      'Escalate when routing is ambiguous.',
      '',
      '## Routing Table',
      'Compatibility marker for legacy checks.',
      '',
    ].join('\n'));

    fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
    fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), [
      '# 01-input',
      '',
      '## Purpose',
      'Input stage.',
      '',
      '## Inputs',
      'Raw data.',
      '',
      '## Outputs',
      'Validated data.',
      '',
      '## Dependencies',
      'None.',
      '',
      '## Completion Criteria',
      'Inputs validated.',
      '',
      '## Handoff',
      'Hand off to 02-output.',
      '',
    ].join('\n'));

    fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
    fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), [
      '# 02-output',
      '',
      '## Purpose',
      'Output stage.',
      '',
      '## Inputs',
      'Validated data.',
      '',
      '## Outputs',
      'Final report.',
      '',
      '## Dependencies',
      '01-input.',
      '',
      '## Completion Criteria',
      'Output complete.',
      '',
      '## Handoff',
      'Deliver final output.',
      '',
    ].join('\n'));

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

    it('fails when SYSTEM.md misses required workflow sections', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nRole only\n');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name.includes('SYSTEM.md contains ## Workflow Rules') && !c.passed)).toBe(true);
    });

    it('fails when root CONTEXT.md misses required router sections', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Task Routing\n- 01-input/CONTEXT.md\n');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name.includes('CONTEXT.md contains ## Loading Order') && !c.passed)).toBe(true);
    });

    it('fails when stage CONTEXT.md misses completion and handoff sections', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\n## Purpose\nInput stage\n');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name.includes('01-input/CONTEXT.md contains ## Completion Criteria') && !c.passed)).toBe(true);
      expect(result.checks.some((c) => c.name.includes('01-input/CONTEXT.md contains ## Handoff') && !c.passed)).toBe(true);
    });

    it('fails when root routing misses a numbered stage folder', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), [
        '# Router',
        '',
        '## How to Use This File',
        'Route tasks by stage.',
        '',
        '## Task Routing',
        '- 01-input/CONTEXT.md',
        '',
        '## Loading Order',
        '1. SYSTEM.md',
        '2. CONTEXT.md',
        '3. Stage CONTEXT.md',
        '4. Only the task files needed',
        '',
        '## Stage Handoff Routing',
        '01-input -> 02-output',
        '',
        '## Escalation',
        'Escalate when routing is ambiguous.',
        '',
      ].join('\n'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name.includes('Root routing references all numbered stages') && !c.passed)).toBe(true);
    });

    it('fails when stage dependencies point to a later stage number', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), [
        '# 01-input',
        '',
        '## Purpose',
        'Input stage.',
        '',
        '## Inputs',
        'Raw data.',
        '',
        '## Outputs',
        'Validated data.',
        '',
        '## Dependencies',
        '02-output',
        '',
        '## Completion Criteria',
        'Inputs validated.',
        '',
        '## Handoff',
        'Hand off to 02-output.',
        '',
      ].join('\n'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name.includes('01-input dependencies do not point to later stages') && !c.passed)).toBe(true);
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

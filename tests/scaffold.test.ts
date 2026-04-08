import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scaffoldWorkspace, ScaffoldOptions } from '../src/scripts/scaffold';

describe('scaffold', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('scaffoldWorkspace', () => {
    it('creates output directory', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      expect(fs.existsSync(outputDir)).toBe(true);
    });

    it('creates SYSTEM.md with folder map', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const systemMd = fs.readFileSync(path.join(outputDir, 'SYSTEM.md'), 'utf-8');
      expect(systemMd).toContain('## Folder Map');
      expect(systemMd).toContain('01-research');
      expect(systemMd).toContain('02-analysis');
      expect(systemMd).toContain('03-report');
    });

    it('creates CONTEXT.md at root level', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const contextMd = fs.readFileSync(path.join(outputDir, 'CONTEXT.md'), 'utf-8');
      expect(contextMd).toContain('## Task Routing');
      expect(contextMd).toContain('01-research');
      expect(contextMd).toContain('02-analysis');
      expect(contextMd).toContain('03-report');
    });

    it('creates robust SYSTEM.md sections for workflow-following prompts', () => {
      const outputDir = path.join(tempDir, 'workspace');
      scaffoldWorkspace({
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      });

      const systemMd = fs.readFileSync(path.join(outputDir, 'SYSTEM.md'), 'utf-8');
      expect(systemMd).toContain('## Role');
      expect(systemMd).toContain('## Folder Map');
      expect(systemMd).toContain('## Workflow Rules');
      expect(systemMd).toContain('## Scope Guardrails');
      expect(systemMd).toContain('## Sequential Execution Protocol');
      expect(systemMd).toContain('## Stage Boundaries');
      expect(systemMd).toContain('## Tooling Policy');
      expect(systemMd.toLowerCase()).toContain('markdown');
    });

    it('creates robust root CONTEXT.md routing and loading order', () => {
      const outputDir = path.join(tempDir, 'workspace');
      scaffoldWorkspace({
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      });

      const contextMd = fs.readFileSync(path.join(outputDir, 'CONTEXT.md'), 'utf-8');
      expect(contextMd).toContain('## How to Use This File');
      expect(contextMd).toContain('## Task Routing');
      expect(contextMd).toContain('## Loading Order');
      expect(contextMd).toContain('## Scope Guardrails');
      expect(contextMd).toContain('## Sequential Routing Contract');
      expect(contextMd).toContain('## Stage Handoff Routing');
      expect(contextMd).toContain('## Escalation');

      expect(contextMd).toContain('01-research/CONTEXT.md');
      expect(contextMd).toContain('02-analysis/CONTEXT.md');
      expect(contextMd).toContain('03-report/CONTEXT.md');
      expect(contextMd).toContain('SYSTEM.md');
      expect(contextMd.toLowerCase()).toContain('markdown');
    });

    it('creates numbered stage folders with CONTEXT.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      for (const stage of options.stages) {
        const stageDir = path.join(outputDir, stage);
        expect(fs.existsSync(stageDir)).toBe(true);
        const contextMd = fs.readFileSync(path.join(stageDir, 'CONTEXT.md'), 'utf-8');
        expect(contextMd.trim().length).toBeGreaterThan(0);
        expect(contextMd).toContain(stage);
      }
    });

    it('creates stage CONTEXT.md files with completion and handoff contracts', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const stages = ['01-research', '02-analysis', '03-report'];

      scaffoldWorkspace({
        name: 'research',
        stages,
        output: outputDir,
      });

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const nextStage = stages[i + 1];
        const stageContext = fs.readFileSync(path.join(outputDir, stage, 'CONTEXT.md'), 'utf-8');

        expect(stageContext).toContain('## Purpose');
        expect(stageContext).toContain('## Inputs');
        expect(stageContext).toContain('## Outputs');
        expect(stageContext).toContain('## Dependencies');
        expect(stageContext).toContain('## Required Evidence');
        expect(stageContext).toContain('## Completion Criteria');
        expect(stageContext).toContain('## Handoff');
        expect(stageContext.toLowerCase()).toContain('markdown');
        expect(stageContext).toContain('00-meta/execution-log.md');

        if (nextStage) {
          expect(stageContext).toContain(nextStage);
        } else {
          expect(stageContext.toLowerCase()).toContain('final output');
        }
      }
    });

    it('creates 00-meta folder with tools.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const toolsMd = path.join(outputDir, '00-meta', 'tools.md');
      expect(fs.existsSync(toolsMd)).toBe(true);
      const content = fs.readFileSync(toolsMd, 'utf-8');
      expect(content).toContain('## Tool Inventory');

      const executionLogPath = path.join(outputDir, '00-meta', 'execution-log.md');
      expect(fs.existsSync(executionLogPath)).toBe(true);
      const executionLog = fs.readFileSync(executionLogPath, 'utf-8');
      expect(executionLog).toContain('## Stage Checklist');
      expect(executionLog).toContain('- [ ] 01-research');
    });

    it('creates README.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const readme = fs.readFileSync(path.join(outputDir, 'README.md'), 'utf-8');
      expect(readme.trim().length).toBeGreaterThan(0);
    });

    it('throws if output directory already exists', () => {
      const outputDir = path.join(tempDir, 'workspace');
      fs.mkdirSync(outputDir, { recursive: true });

      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      expect(() => scaffoldWorkspace(options)).toThrow('already exists');
    });

    it('overwrites if force is true', () => {
      const outputDir = path.join(tempDir, 'workspace');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, 'existing.txt'), 'data');

      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
        force: true,
      };

      scaffoldWorkspace(options);

      const systemMd = path.join(outputDir, 'SYSTEM.md');
      expect(fs.existsSync(systemMd)).toBe(true);
    });

    it('throws if stages list is empty', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: [],
        output: outputDir,
      };

      expect(() => scaffoldWorkspace(options)).toThrow('stages');
    });
  });
});

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
      expect(contextMd).toContain('## Routing Table');
      expect(contextMd).toContain('01-research');
      expect(contextMd).toContain('02-analysis');
      expect(contextMd).toContain('03-report');
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

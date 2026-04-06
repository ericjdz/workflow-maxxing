import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installSkill, detectProjectRoot } from '../src/install';

describe('install', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectProjectRoot', () => {
    it('returns the directory containing package.json', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const result = detectProjectRoot(projectDir);
      expect(result).toBe(projectDir);
    });

    it('returns the directory containing .git', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(path.join(projectDir, '.git'), { recursive: true });

      const result = detectProjectRoot(projectDir);
      expect(result).toBe(projectDir);
    });

    it('returns current directory if no marker found', () => {
      const result = detectProjectRoot(tempDir);
      expect(result).toBe(tempDir);
    });

    it('walks up parent directories to find marker', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const nestedDir = path.join(projectDir, 'src', 'utils');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const result = detectProjectRoot(nestedDir);
      expect(result).toBe(projectDir);
    });
  });

  describe('installSkill', () => {
    it('creates the skill directory structure', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const templatesDir = path.join(__dirname, '..', 'templates');
      const result = await installSkill(projectDir, templatesDir);

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'workspace-maxxing'))).toBe(true);
    });

    it('copies SKILL.md to the skill directory', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const templatesDir = path.join(__dirname, '..', 'templates');
      await installSkill(projectDir, templatesDir);

      const skillPath = path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
    });

    it('copies workspace templates', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const templatesDir = path.join(__dirname, '..', 'templates');
      await installSkill(projectDir, templatesDir);

      const systemMd = path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', '.workspace-templates', 'SYSTEM.md');
      const contextMd = path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', '.workspace-templates', 'CONTEXT.md');
      expect(fs.existsSync(systemMd)).toBe(true);
      expect(fs.existsSync(contextMd)).toBe(true);
    });

    it('is idempotent — running twice produces same result', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const templatesDir = path.join(__dirname, '..', 'templates');
      await installSkill(projectDir, templatesDir);
      const result2 = await installSkill(projectDir, templatesDir);

      expect(result2.success).toBe(true);
      const skillPath = path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
    });
  });
});

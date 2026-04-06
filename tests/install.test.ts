import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installSkill, detectProjectRoot, getAgentTargetPath } from '../src/install';

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

  describe('getAgentTargetPath', () => {
    it('returns default path for no agent', () => {
      const result = getAgentTargetPath('/project-root', undefined);
      expect(result).toBe(path.join('/project-root', '.agents', 'skills', 'workspace-maxxing'));
    });

    it('returns opencode path for --opencode flag', () => {
      const result = getAgentTargetPath('/project-root', 'opencode');
      expect(result).toBe(path.join('/project-root', '.agents', 'skills', 'workspace-maxxing'));
    });

    it('returns claude path for --claude flag', () => {
      const result = getAgentTargetPath('/project-root', 'claude');
      expect(result).toBe(path.join('/project-root', '.claude', 'skills'));
    });

    it('returns copilot path for --copilot flag', () => {
      const result = getAgentTargetPath('/project-root', 'copilot');
      expect(result).toBe(path.join('/project-root', '.github', 'copilot-instructions'));
    });

    it('returns gemini path for --gemini flag', () => {
      const result = getAgentTargetPath('/project-root', 'gemini');
      expect(result).toBe(path.join('/project-root', '.gemini', 'skills'));
    });

    it('installs to claude path when agent is claude', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      const templatesDir = path.join(__dirname, '..', 'templates');
      const result = await installSkill(projectDir, templatesDir, 'claude');

      expect(result.success).toBe(true);
      expect(result.skillPath).toContain('.claude');
      expect(fs.existsSync(path.join(projectDir, '.claude', 'skills', 'SKILL.md'))).toBe(true);
    });
  });
});

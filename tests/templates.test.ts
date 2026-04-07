import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', 'templates');

describe('Template files', () => {
  const requiredFiles = [
    'SKILL.md',
    '.workspace-templates/SYSTEM.md',
    '.workspace-templates/CONTEXT.md',
    '.workspace-templates/workspace/00-meta/CONTEXT.md',
    '.workspace-templates/workspace/01-input/CONTEXT.md',
    '.workspace-templates/workspace/02-process/CONTEXT.md',
    '.workspace-templates/workspace/03-output/CONTEXT.md',
    '.workspace-templates/workspace/README.md',
  ];

  describe.each(requiredFiles)('%s', (filePath) => {
    it('exists', () => {
      const fullPath = path.join(templatesDir, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it('is not empty', () => {
      const fullPath = path.join(templatesDir, filePath);
      if (!fs.existsSync(fullPath)) {
        fail(`File does not exist: ${fullPath}`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  it('SKILL.md contains required sections', () => {
    const skillPath = path.join(templatesDir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      fail('SKILL.md does not exist');
      return;
    }
    const content = fs.readFileSync(skillPath, 'utf-8');

    expect(content).toContain('# Workspace-Maxxing');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Iron Law');
    expect(content).toContain('## Hybrid Flow');
    expect(content).toContain('## Sub-Skill Dispatch');
    expect(content).toContain('## Available Scripts');
    expect(content).toContain('## Anti-Rationalization Table');
    expect(content).toContain('## Integration');
    expect(content).toContain('## ICM Rules');
    expect(content).toContain('## Output Format');
  });

  it('SYSTEM.md contains Layer 0 content', () => {
    const systemPath = path.join(templatesDir, '.workspace-templates', 'SYSTEM.md');
    if (!fs.existsSync(systemPath)) {
      fail('SYSTEM.md does not exist');
      return;
    }
    const content = fs.readFileSync(systemPath, 'utf-8');

    expect(content.toLowerCase()).toContain('folder map');
    expect(content).toContain('workspace');
  });

  it('CONTEXT.md contains routing table structure', () => {
    const contextPath = path.join(templatesDir, '.workspace-templates', 'CONTEXT.md');
    if (!fs.existsSync(contextPath)) {
      fail('CONTEXT.md does not exist');
      return;
    }
    const content = fs.readFileSync(contextPath, 'utf-8');

    expect(content).toContain('routing');
    expect(content).toContain('workspace');
  });

  it('SKILL.md has YAML frontmatter with name and description', () => {
    const skillPath = path.join(templatesDir, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---\nname:/m);
    expect(content).toMatch(/description:/);
  });

  it('SKILL.md references all 7 sub-skills', () => {
    const skillPath = path.join(templatesDir, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('validation');
    expect(content).toContain('research');
    expect(content).toContain('prompt-engineering');
    expect(content).toContain('testing');
    expect(content).toContain('iteration');
    expect(content).toContain('architecture');
    expect(content).toContain('tooling');
  });
});

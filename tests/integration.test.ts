import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-integration-'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('end-to-end: install and verify complete structure', () => {
    // Build first
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });

    // Run installer
    const output = execSync(`node "${path.join(__dirname, '..', 'dist', 'index.js')}" --opencode`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates'),
      },
    });

    expect(output).toContain('installed');

    // Verify skill directory
    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(skillDir)).toBe(true);

    // Verify all expected files exist
    const expectedFiles = [
      'SKILL.md',
      '.workspace-templates/SYSTEM.md',
      '.workspace-templates/CONTEXT.md',
      '.workspace-templates/workspace/00-meta/CONTEXT.md',
      '.workspace-templates/workspace/01-input/CONTEXT.md',
      '.workspace-templates/workspace/02-process/CONTEXT.md',
      '.workspace-templates/workspace/03-output/CONTEXT.md',
      '.workspace-templates/workspace/README.md',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(skillDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    }

    // Verify SKILL.md has required sections
    const skillContent = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
    expect(skillContent).toContain('## Role');
    expect(skillContent).toContain('## Process');
    expect(skillContent).toContain('## ICM Rules');
    expect(skillContent).toContain('## Output Format');

    // Verify SYSTEM.md has Layer 0 content
    const systemContent = fs.readFileSync(path.join(skillDir, '.workspace-templates', 'SYSTEM.md'), 'utf-8');
    expect(systemContent.toLowerCase()).toContain('folder map');
  });

  it('idempotency: running install twice produces valid result', () => {
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });

    // Run twice
    execSync(`node "${path.join(__dirname, '..', 'dist', 'index.js')}" --opencode`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates'),
      },
    });

    execSync(`node "${path.join(__dirname, '..', 'dist', 'index.js')}" --opencode`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates'),
      },
    });

    // Still valid
    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);
  });
});

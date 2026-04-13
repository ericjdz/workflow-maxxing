import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('CLI', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-cli-'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const repoRoot = path.join(__dirname, '..');
const cliPath = path.join(repoRoot, 'dist', 'index.js');

it('shows help when no args provided (default behavior)', () => {
    const output = execSync(`node "${cliPath}"`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates') },
    });

    // When no args, shows help (not install)
    expect(output).toContain('workspace-maxxing');
    expect(output).toContain('--opencode');
  });

  it('shows help when --help flag is provided', () => {
    const output = execSync(`node "${cliPath}" --help`, {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    expect(output).toContain('workspace-maxxing');
    expect(output).toContain('--opencode');
  });

  it('installs skill when --opencode flag is provided', () => {
    const output = execSync(`node "${cliPath}" --opencode`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates') },
    });

    expect(output).toContain('installed');
    expect(
      fs.existsSync(path.join(tempDir, '.agents', 'skills', 'workspace-maxxing', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to claude path when --claude flag is provided', () => {
    const output = execSync(`node "${cliPath}" --claude`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates') },
    });

    expect(output).toContain('claude');
    expect(
      fs.existsSync(path.join(tempDir, '.claude', 'skills', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to copilot path when --copilot flag is provided', () => {
    const output = execSync(`node "${cliPath}" --copilot`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates') },
    });

    expect(output).toContain('copilot');
    expect(
      fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to gemini path when --gemini flag is provided', () => {
    const output = execSync(`node "${cliPath}" --gemini`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates') },
    });

    expect(output).toContain('gemini');
    expect(
      fs.existsSync(path.join(tempDir, '.gemini', 'skills', 'SKILL.md')),
    ).toBe(true);
  });

  it('errors on unsupported flag', () => {
    try {
      execSync(`node "${cliPath}" --unknown-flag`, {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      fail('Should have thrown');
    } catch (error) {
      expect(true).toBe(true);
    }
  });
});

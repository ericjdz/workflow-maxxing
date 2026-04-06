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

  it('shows help when no args provided', () => {
    const output = execSync('node dist/index.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
    });

    expect(output).toContain('workspace-maxxing');
    expect(output).toContain('--opencode');
    expect(output).toContain('--claude');
    expect(output).toContain('--copilot');
    expect(output).toContain('--gemini');
  });

  it('shows help when --help flag is provided', () => {
    const output = execSync('node dist/index.js --help', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
    });

    expect(output).toContain('workspace-maxxing');
    expect(output).toContain('--opencode');
  });

  it('installs skill when --opencode flag is provided', () => {
    const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
    const output = execSync(`node "${cliPath}" --opencode`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates') },
    });

    expect(output).toContain('installed');
    expect(
      fs.existsSync(path.join(tempDir, '.agents', 'skills', 'workspace-maxxing', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to claude path when --claude flag is provided', () => {
    const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
    const output = execSync(`node "${cliPath}" --claude`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates') },
    });

    expect(output).toContain('claude');
    expect(
      fs.existsSync(path.join(tempDir, '.claude', 'skills', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to copilot path when --copilot flag is provided', () => {
    const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
    const output = execSync(`node "${cliPath}" --copilot`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates') },
    });

    expect(output).toContain('copilot');
    expect(
      fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions', 'SKILL.md')),
    ).toBe(true);
  });

  it('installs to gemini path when --gemini flag is provided', () => {
    const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
    const output = execSync(`node "${cliPath}" --gemini`, {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates') },
    });

    expect(output).toContain('gemini');
    expect(
      fs.existsSync(path.join(tempDir, '.gemini', 'skills', 'SKILL.md')),
    ).toBe(true);
  });

  it('errors on unsupported flag', () => {
    try {
      execSync('node dist/index.js --unknown-flag', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      fail('Should have thrown');
    } catch (error) {
      expect(true).toBe(true);
    }
  });
});

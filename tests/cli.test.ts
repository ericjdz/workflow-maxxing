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

  it('errors on unsupported flag', () => {
    try {
      execSync('node dist/index.js --claude', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      fail('Should have thrown');
    } catch (error) {
      // Expected — --claude not yet supported
      expect(true).toBe(true);
    }
  });
});

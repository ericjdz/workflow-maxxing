import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installTool, InstallToolOptions } from '../src/scripts/install-tool';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const { execSync } = require('child_process');

describe('install-tool', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-tool-test-'));
    const metaDir = path.join(tempDir, '00-meta');
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(
      path.join(metaDir, 'tools.md'),
      '# Tool Inventory\n\n## Installed Tools\n\n| Tool | Version | Manager | Installed |\n|------|---------|---------|-----------|\n| — | — | — | — |\n',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  describe('installTool', () => {
    it('runs correct npm install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'pdf-lib',
        manager: 'npm',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'npm install pdf-lib',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct pip install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'requests',
        manager: 'pip',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'pip install requests',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct npx install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'create-next-app',
        manager: 'npx',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'npx create-next-app',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct brew install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'ffmpeg',
        manager: 'brew',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'brew install ffmpeg',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('updates tools.md with installed tool', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'pdf-lib',
        manager: 'npm',
        workspace: tempDir,
      };

      installTool(options);

      const toolsMd = fs.readFileSync(path.join(tempDir, '00-meta', 'tools.md'), 'utf-8');
      expect(toolsMd).toContain('pdf-lib');
      expect(toolsMd).toContain('npm');
    });

    it('throws if install command fails', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        const err = new Error('Command failed');
        (err as any).status = 1;
        throw err;
      });

      const options: InstallToolOptions = {
        tool: 'nonexistent-package',
        manager: 'npm',
        workspace: tempDir,
      };

      expect(() => installTool(options)).toThrow('Command failed');
    });

    it('throws for unsupported manager', () => {
      const options: InstallToolOptions = {
        tool: 'something',
        manager: 'unknown' as any,
        workspace: tempDir,
      };

      expect(() => installTool(options)).toThrow('Unsupported package manager');
    });
  });
});

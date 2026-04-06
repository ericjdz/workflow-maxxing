import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type PackageManager = 'npm' | 'pip' | 'npx' | 'brew';

export interface InstallToolOptions {
  tool: string;
  manager: PackageManager;
  workspace: string;
}

export function installTool(options: InstallToolOptions): void {
  const { tool, manager, workspace } = options;
  const ws = path.resolve(workspace);

  const validManagers: PackageManager[] = ['npm', 'pip', 'npx', 'brew'];
  if (!validManagers.includes(manager)) {
    throw new Error(`Unsupported package manager: ${manager}. Supported: ${validManagers.join(', ')}`);
  }

  const command = manager === 'npx' ? `npx ${tool}` : `${manager} install ${tool}`;

  console.log(`Installing ${tool} via ${manager}...`);
  try {
    execSync(command, { cwd: ws, stdio: 'inherit' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to install ${tool}: ${message}`);
  }

  updateToolsMd(ws, tool, manager);

  console.log(`✓ ${tool} installed and added to tool inventory`);
}

function updateToolsMd(workspace: string, tool: string, manager: string): void {
  const toolsMdPath = path.join(workspace, '00-meta', 'tools.md');

  if (!fs.existsSync(toolsMdPath)) {
    throw new Error(`tools.md not found at: ${toolsMdPath}`);
  }

  const content = fs.readFileSync(toolsMdPath, 'utf-8');
  const now = new Date().toISOString().split('T')[0];

  const placeholderRow = '| — | — | — | — |';
  const newRow = `| ${tool} | latest | ${manager} | ${now} |`;

  let updated: string;
  if (content.includes(placeholderRow)) {
    updated = content.replace(placeholderRow, `${placeholderRow}\n${newRow}`);
  } else {
    const pendingIdx = content.indexOf('## Pending Tools');
    if (pendingIdx !== -1) {
      updated = content.slice(0, pendingIdx) + newRow + '\n\n' + content.slice(pendingIdx);
    } else {
      updated = content + '\n' + newRow + '\n';
    }
  }

  fs.writeFileSync(toolsMdPath, updated);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const tool = parseArg('--tool');
  const manager = parseArg('--manager') as PackageManager;
  const workspace = parseArg('--workspace');

  if (!tool || !manager || !workspace) {
    console.error('Usage: node install-tool.ts --tool <name> --manager <npm|pip|npx|brew> --workspace <path>');
    process.exit(1);
  }

  installTool({ tool, manager, workspace });
}

import * as fs from 'fs';
import * as path from 'path';

export interface InstallResult {
  success: boolean;
  skillPath: string;
  error?: string;
}

/**
 * Walk up from startDir looking for package.json or .git directory.
 * Returns the first parent containing a marker, or startDir if none found.
 */
export function detectProjectRoot(startDir: string): string {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  while (current !== root) {
    const hasPackageJson = fs.existsSync(path.join(current, 'package.json'));
    const hasGit = fs.existsSync(path.join(current, '.git'));

    if (hasPackageJson || hasGit) {
      return current;
    }

    current = path.dirname(current);
  }

  return startDir;
}

/**
 * Recursively copy a directory, overwriting existing files.
 */
function copyDirSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install the workspace-maxxing skill into a project.
 * Copies SKILL.md and .workspace-templates/ to .agents/skills/workspace-maxxing/
 */
export async function installSkill(
  projectRoot: string,
  templatesDir: string,
): Promise<InstallResult> {
  const skillDir = path.join(projectRoot, '.agents', 'skills', 'workspace-maxxing');

  try {
    // Copy SKILL.md
    const skillMdSrc = path.join(templatesDir, 'SKILL.md');
    const skillMdDest = path.join(skillDir, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillMdDest), { recursive: true });
    fs.copyFileSync(skillMdSrc, skillMdDest);

    // Copy .workspace-templates/
    const workspaceTemplatesSrc = path.join(templatesDir, '.workspace-templates');
    const workspaceTemplatesDest = path.join(skillDir, '.workspace-templates');
    copyDirSync(workspaceTemplatesSrc, workspaceTemplatesDest);

    return { success: true, skillPath: skillDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, skillPath: skillDir, error: message };
  }
}

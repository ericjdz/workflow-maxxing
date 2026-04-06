import * as fs from 'fs';
import * as path from 'path';

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: CheckResult[];
}

export function validateWorkspace(workspacePath: string): ValidationResult {
  const ws = path.resolve(workspacePath);
  const checks: CheckResult[] = [];

  const systemMdPath = path.join(ws, 'SYSTEM.md');
  const systemExists = fs.existsSync(systemMdPath);
  checks.push({
    name: 'SYSTEM.md exists',
    passed: systemExists,
    message: systemExists ? 'Found' : 'Missing',
  });

  if (systemExists) {
    const systemContent = fs.readFileSync(systemMdPath, 'utf-8');
    const hasFolderMap = systemContent.toLowerCase().includes('folder map');
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: hasFolderMap,
      message: hasFolderMap ? 'Found' : 'Missing "folder map" reference',
    });
  } else {
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: false,
      message: 'Cannot check — SYSTEM.md missing',
    });
  }

  const contextMdPath = path.join(ws, 'CONTEXT.md');
  const contextExists = fs.existsSync(contextMdPath);
  checks.push({
    name: 'CONTEXT.md exists at root',
    passed: contextExists,
    message: contextExists ? 'Found' : 'Missing',
  });

  const entries = fs.readdirSync(ws, { withFileTypes: true });
  const numberedFolders = entries
    .filter((e) => e.isDirectory() && /^\d/.test(e.name))
    .map((e) => e.name);

  for (const folder of numberedFolders) {
    const contextPath = path.join(ws, folder, 'CONTEXT.md');
    const exists = fs.existsSync(contextPath);
    checks.push({
      name: `${folder}/CONTEXT.md exists`,
      passed: exists,
      message: exists ? 'Found' : 'Missing',
    });

    if (exists) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const notEmpty = content.trim().length > 0;
      checks.push({
        name: `${folder}/CONTEXT.md is not empty`,
        passed: notEmpty,
        message: notEmpty ? `${content.trim().length} chars` : 'File is empty',
      });
    }
  }

  const allFiles = getAllMarkdownFiles(ws);
  const duplicateCheck = checkDuplicateContent(allFiles);
  checks.push(duplicateCheck);

  const passed = checks.every((c) => c.passed);

  console.log(`\nValidation: ${ws}`);
  console.log('='.repeat(50));
  for (const check of checks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  console.log('='.repeat(50));
  console.log(passed ? '✓ All checks passed' : '✗ Some checks failed');

  return { passed, checks };
}

function getAllMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function checkDuplicateContent(files: string[]): CheckResult {
  const MIN_DUPLICATE_LENGTH = 50;
  const duplicates: string[] = [];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const contentA = fs.readFileSync(files[i], 'utf-8');
      const contentB = fs.readFileSync(files[j], 'utf-8');

      const linesA = contentA.split('\n');
      const linesB = contentB.split('\n');

      for (const lineA of linesA) {
        const trimmed = lineA.trim();
        if (trimmed.length > MIN_DUPLICATE_LENGTH) {
          for (const lineB of linesB) {
            if (lineB.trim() === trimmed) {
              duplicates.push(trimmed.substring(0, 60) + '...');
              break;
            }
          }
        }
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      name: 'No duplicate content across files',
      passed: false,
      message: `Found ${duplicates.length} duplicate text block(s)`,
    };
  }

  return {
    name: 'No duplicate content across files',
    passed: true,
    message: 'No duplicates found',
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceIdx = args.indexOf('--workspace');
  const workspace = workspaceIdx !== -1 ? args[workspaceIdx + 1] : undefined;

  if (!workspace) {
    console.error('Usage: node validate.ts --workspace <path>');
    process.exit(1);
  }

  const result = validateWorkspace(workspace);
  process.exit(result.passed ? 0 : 1);
}

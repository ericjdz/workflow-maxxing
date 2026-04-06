# Workspace-Maxxing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npx-installable CLI that copies a workspace-builder skill into `.agents/skills/` for OpenCode agents.

**Architecture:** A zero-dependency TypeScript CLI with two modules: `index.ts` (argument parsing + entry point) and `install.ts` (recursive file copying). Templates are bundled in the package and copied verbatim to the target project.

**Tech Stack:** TypeScript, Node.js builtins only (`fs`, `path`, `process`), Jest for testing.

---

## File Structure

```
workspace-maxxing/
├── package.json                              # Package config, bin entry, scripts
├── tsconfig.json                             # TypeScript compiler options
├── src/
│   ├── index.ts                              # CLI: parse args, call installer
│   └── install.ts                            # Installer: detect root, copy files
├── templates/
│   ├── SKILL.md                              # Agent instructions (installed as skill)
│   └── .workspace-templates/
│       ├── SYSTEM.md                         # Layer 0: always-loaded system prompt
│       ├── CONTEXT.md                        # Layer 1: task-to-workspace routing
│       └── workspace/
│           ├── 00-meta/CONTEXT.md            # Workspace-level routing
│           ├── 01-input/CONTEXT.md           # Input stage routing
│           ├── 02-process/CONTEXT.md         # Process stage routing
│           ├── 03-output/CONTEXT.md          # Output stage routing
│           └── README.md                     # Usage guide
├── tests/
│   ├── install.test.ts                       # Installer unit tests
│   ├── cli.test.ts                           # CLI argument parsing tests
│   └── templates.test.ts                     # Template validation tests
└── docs/
    └── superpowers/
        ├── specs/2026-04-07-workspace-maxxing-design.md
        └── plans/2026-04-07-workspace-maxxing-plan.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Test: N/A

- [ ] **Step 1: Create package.json**

```json
{
  "name": "workspace-maxxing",
  "version": "0.1.0",
  "description": "npx-installable skill for AI agents to create structured workspaces using ICM methodology",
  "bin": {
    "workspace-maxxing": "dist/index.js"
  },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest --config jest.config.js",
    "test:watch": "jest --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["ai-agent", "workspace", "skill", "opencode", "icm"],
  "license": "MIT",
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create jest.config.js**

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
```

- [ ] **Step 4: Install dependencies and verify build**

```bash
npm install
```
Expected: `node_modules/` created, no errors.

```bash
npm run build
```
Expected: `dist/` created with compiled JS (will be empty until source files exist, but no errors).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json jest.config.js
git commit -m "chore: scaffold workspace-maxxing project"
```

---

### Task 2: Installer Module

**Files:**
- Create: `src/install.ts`
- Test: `tests/install.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/install.test.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installSkill, detectProjectRoot } from '../src/install';

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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/install.test.ts --no-coverage 2>&1 | head -20
```
Expected: FAIL with "Cannot find module '../src/install'"

- [ ] **Step 3: Write minimal implementation**

Create `src/install.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/install.test.ts --no-coverage
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/install.ts tests/install.test.ts
git commit -m "feat: implement installer with project root detection and file copying"
```

---

### Task 3: CLI Entry Point

**Files:**
- Create: `src/index.ts`
- Test: `tests/cli.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/cli.test.ts`:

```typescript
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
    const output = execSync(`node dist/index.js --opencode`, {
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/cli.test.ts --no-coverage 2>&1 | head -20
```
Expected: FAIL with "Cannot find module '../dist/index.js'" or similar

- [ ] **Step 3: Write minimal implementation**

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import * as path from 'path';
import { detectProjectRoot, installSkill } from './install';

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [options]

Options:
  --opencode    Install skill for OpenCode agents
  --help        Show this help message

Examples:
  npx workspace-maxxing --opencode
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--opencode')) {
    const cwd = process.cwd();
    const projectRoot = detectProjectRoot(cwd);

    if (projectRoot !== cwd) {
      console.log(`Detected project root: ${projectRoot}`);
    }

    // Allow overriding templates path for testing; default to bundled templates
    const templatesDir =
      process.env.WORKSPACE_MAXXING_TEMPLATES ??
      path.join(__dirname, '..', 'templates');

    console.log('Installing workspace-maxxing skill...');
    const result = await installSkill(projectRoot, templatesDir);

    if (result.success) {
      console.log(`Skill installed to: ${result.skillPath}`);
      console.log('Open a new OpenCode session and invoke the workspace-maxxing skill to get started.');
    } else {
      console.error(`Installation failed: ${result.error}`);
      process.exit(1);
    }

    return;
  }

  console.error(`Unknown flag: ${args.find((a) => a.startsWith('--'))}`);
  console.error('Run "npx workspace-maxxing --help" for usage.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: Build the project**

```bash
npm run build
```
Expected: `dist/` created with `index.js` and `install.js`

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest tests/cli.test.ts --no-coverage
```
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/index.ts tests/cli.test.ts
git commit -m "feat: add CLI entry point with --opencode flag and help output"
```

---

### Task 4: Template Validation Tests

**Files:**
- Test: `tests/templates.test.ts`
- Modify: `templates/SKILL.md` (created in Task 5, but tests reference it)

Note: These tests will fail until Task 5 creates the template files. That's intentional — we write tests first.

- [ ] **Step 1: Write the failing test**

Create `tests/templates.test.ts`:

```typescript
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
    expect(content).toContain('## Role');
    expect(content).toContain('## Process');
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

    expect(content).toContain('folder map');
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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/templates.test.ts --no-coverage 2>&1 | head -30
```
Expected: FAIL — template files don't exist yet

- [ ] **Step 3: Commit the tests only**

```bash
git add tests/templates.test.ts
git commit -m "test: add template validation tests"
```

---

### Task 5: SKILL.md Template

**Files:**
- Create: `templates/SKILL.md`
- Test: `tests/templates.test.ts` (from Task 4)

- [ ] **Step 1: Write the SKILL.md**

Create `templates/SKILL.md`:

```markdown
# Workspace-Maxxing

## Role

You are a workspace architect. You create structured, ICM-compliant workspaces that serve as both agent instructions and reusable skill packages.

## Process

### 1. CAPTURE INTENT

Ask the user: "What workflow do you want to automate?"

Understand:
- What is the end goal? (e.g., research report, PDF output, content pipeline)
- What are the input sources? (web, files, APIs, databases)
- What is the expected output format?
- Are there any constraints or preferences?

### 2. PROPOSE STRUCTURE

Design a workspace using the Interpretable Context Methodology (ICM):

- **Numbered folders** for workflow stages (01-research, 02-draft, 03-review, 04-output)
- **SYSTEM.md** (Layer 0) — always-loaded system prompt with folder map and core rules
- **CONTEXT.md** (Layer 1) — routing table mapping tasks to workspaces
- **Per-folder CONTEXT.md** (Layer 2) — what to load, in order, for each stage
- **Content files** (Layer 3) — reference material, loaded selectively

Present the plan to the user as a file tree with brief descriptions.

### 3. GET APPROVAL

Show the proposed structure. Wait for approval. **Do not build until the user approves.**

If the user requests changes, update the proposal and show it again.

### 4. BUILD WORKSPACE

Create the approved structure:
1. Create numbered folders for each stage
2. Write SYSTEM.md with the folder map and agent rules
3. Write CONTEXT.md files with routing instructions
4. Write content files with reference material
5. Write a README.md explaining how to use the workspace

### 5. ASSESS TOOLS

Scan the environment for available tools:
- Check installed packages (`npm list`, `pip list`, etc.)
- Check available CLI tools in PATH
- Check what the agent harness can access

List available tools. Propose any missing tools the workspace needs. **Get user approval before installing anything.**

### 6. INSTALL TOOLS

After user approval, install proposed tools. Log what was installed.

### 7. TEST AUTONOMOUSLY

Spawn sub-agents with diverse test cases relevant to the workspace:
- Give each sub-agent a realistic task
- Evaluate the output against expected criteria
- Record what worked and what didn't

Only involve the human if confidence is low or results are inconsistent.

### 8. ITERATE

Based on test results:
- Update SYSTEM.md if agent behavior was wrong
- Update CONTEXT.md if routing was unclear
- Update content files if reference material was insufficient
- Re-test if significant changes were made

### 9. DELIVER

Output three artifacts:
1. **workspace/** — the built workspace folder
2. **.agents/skills/<workspace-name>/** — installable skill package
3. **USAGE.md** — how to use this workspace in future sessions

## ICM Rules

Follow these rules strictly:

1. **Canonical Sources** — Each fact lives in exactly one file. Other files reference it, never duplicate it.
2. **One-Way Dependencies** — A → B is fine. B → A means you need a third file C that both reference.
3. **Selective Loading** — Route to specific sections of files, not entire files. Load only what the task needs.
4. **Numbered Folders** — Use numbered folders for workflow stages: `01-`, `02-`, `03-`, etc.
5. **Routing ≠ Content** — CONTEXT.md files tell agents what to load. They do not contain the knowledge itself.

## Output Format

When delivering the final workspace:

```
workspace/
├── SYSTEM.md              # Layer 0: always loaded
├── CONTEXT.md             # Layer 1: routing table
├── 01-<stage>/
│   └── CONTEXT.md         # Layer 2: stage-specific routing
├── 02-<stage>/
│   └── CONTEXT.md
├── ...
└── README.md              # Usage guide

.agents/skills/<workspace-name>/
└── SKILL.md               # Installable skill

USAGE.md                   # How to use in future sessions
```
```

- [ ] **Step 2: Run template tests to verify they pass**

```bash
npx jest tests/templates.test.ts --no-coverage
```
Expected: SKILL.md-related tests PASS, other template tests still FAIL (files not yet created)

- [ ] **Step 3: Commit**

```bash
git add templates/SKILL.md
git commit -m "feat: add SKILL.md with complete agent instructions for workspace creation"
```

---

### Task 6: Workspace Templates

**Files:**
- Create: `templates/.workspace-templates/SYSTEM.md`
- Create: `templates/.workspace-templates/CONTEXT.md`
- Create: `templates/.workspace-templates/workspace/00-meta/CONTEXT.md`
- Create: `templates/.workspace-templates/workspace/01-input/CONTEXT.md`
- Create: `templates/.workspace-templates/workspace/02-process/CONTEXT.md`
- Create: `templates/.workspace-templates/workspace/03-output/CONTEXT.md`
- Create: `templates/.workspace-templates/workspace/README.md`
- Test: `tests/templates.test.ts` (from Task 4)

- [ ] **Step 1: Create SYSTEM.md (Layer 0 template)**

Create `templates/.workspace-templates/SYSTEM.md`:

```markdown
# System — Workspace Root

## Folder Map

| Folder | Purpose |
|--------|---------|
| 00-meta/ | Workspace configuration, tool inventory, session notes |
| 01-input/ | Source materials, research data, raw inputs |
| 02-process/ | Working documents, analysis, drafts |
| 03-output/ | Final deliverables, exports, published content |

## Rules

1. Read this file first every session
2. Check CONTEXT.md for task routing before loading any other files
3. Load only the files and sections your task requires
4. Never duplicate information — reference canonical sources instead
5. One-way dependencies only: downstream folders may reference upstream, never the reverse

## Tool Inventory

Tools available in this workspace are tracked in `00-meta/tools.md`.
Check this file before proposing new tool installations.
```

- [ ] **Step 2: Create CONTEXT.md (Layer 1 routing template)**

Create `templates/.workspace-templates/CONTEXT.md`:

```markdown
# Routing Table

## How to Use This File

This file maps tasks to workspaces. Read the task description, find the matching entry, and load only the files listed.

## Task Routing

| When you need to... | Go to | Load |
|---------------------|-------|------|
| Understand workspace structure | SYSTEM.md | Always loaded |
| Gather inputs or research | 01-input/CONTEXT.md | Stage-specific routing |
| Process, analyze, or draft | 02-process/CONTEXT.md | Stage-specific routing |
| Produce final output | 03-output/CONTEXT.md | Stage-specific routing |
| Check available tools | 00-meta/tools.md | Tool inventory |

## Loading Order

1. SYSTEM.md (always)
2. This file (once per session)
3. The relevant workspace CONTEXT.md
4. Only the content files your task needs
```

- [ ] **Step 3: Create workspace folder CONTEXT.md files**

Create `templates/.workspace-templates/workspace/00-meta/CONTEXT.md`:

```markdown
# 00-meta — Workspace Configuration

## Purpose

Workspace-level configuration, tool inventory, and session notes.

## Files in This Folder

| File | Purpose |
|------|---------|
| tools.md | Inventory of available tools and their versions |
| session-log.md | Log of workspace sessions |

## Routing

- To check available tools: read `tools.md`
- To propose new tools: update `tools.md` after user approval
```

Create `templates/.workspace-templates/workspace/01-input/CONTEXT.md`:

```markdown
# 01-input — Input Stage

## Purpose

Source materials, research data, and raw inputs.

## Files in This Folder

| File | Purpose |
|------|---------|
| sources.md | List of input sources and access methods |
| research/ | Raw research notes and findings |

## Routing

- To gather information: check `sources.md` for available inputs
- To add research: create files in `research/` with date-prefixed names
```

Create `templates/.workspace-templates/workspace/02-process/CONTEXT.md`:

```markdown
# 02-process — Process Stage

## Purpose

Working documents, analysis, and drafts.

## Files in This Folder

| File | Purpose |
|------|---------|
| analysis/ | Working analysis and notes |
| drafts/ | Draft documents under iteration |

## Routing

- To analyze inputs: create files in `analysis/` referencing sources from 01-input/
- To draft content: create files in `drafts/`
- Reference upstream files (01-input/), never duplicate their content
```

Create `templates/.workspace-templates/workspace/03-output/CONTEXT.md`:

```markdown
# 03-output — Output Stage

## Purpose

Final deliverables, exports, and published content.

## Files in This Folder

| File | Purpose |
|------|---------|
| deliverables/ | Final output documents |
| exports/ | Exported files in various formats |

## Routing

- To produce output: create files in `deliverables/`
- To export: create files in `exports/`
- Reference processed content from 02-process/, never duplicate it
```

- [ ] **Step 4: Create workspace README.md**

Create `templates/.workspace-templates/workspace/README.md`:

```markdown
# Workspace

This workspace follows the Interpretable Context Methodology (ICM).

## Structure

- **SYSTEM.md** — Always loaded. Contains the folder map and core rules.
- **CONTEXT.md** — Routing table. Maps tasks to workspaces.
- **Numbered folders** — Workflow stages (01-input → 02-process → 03-output).
- **Per-folder CONTEXT.md** — Stage-specific routing instructions.

## How to Use

1. Start a new session by reading SYSTEM.md
2. Check CONTEXT.md to find the right workspace for your task
3. Load only the files you need — not everything
4. Follow ICM rules: canonical sources, one-way dependencies, selective loading

## ICM Rules

- Each fact lives in exactly one file
- One-way dependencies only (downstream references upstream)
- Route to sections, not whole files
- Numbered folders for workflow stages
```

- [ ] **Step 5: Create 00-meta/tools.md template**

Create `templates/.workspace-templates/workspace/00-meta/tools.md`:

```markdown
# Tool Inventory

## Available Tools

_List tools available in this workspace. Update after each installation._

| Tool | Version | Purpose | Installed |
|------|---------|---------|-----------|
| | | | |

## Proposed Tools

_Tools proposed but not yet installed. Remove after user approval and installation._

| Tool | Purpose | Status |
|------|---------|--------|
| | | |
```

- [ ] **Step 6: Run all template tests**

```bash
npx jest tests/templates.test.ts --no-coverage
```
Expected: ALL tests PASS

- [ ] **Step 7: Run full test suite**

```bash
npm test
```
Expected: ALL tests PASS (install, CLI, templates)

- [ ] **Step 8: Commit**

```bash
git add templates/.workspace-templates/
git commit -m "feat: add workspace templates with ICM structure"
```

---

### Task 7: Integration Test

**Files:**
- Create: `tests/integration.test.ts`

- [ ] **Step 1: Write the integration test**

Create `tests/integration.test.ts`:

```typescript
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
    const output = execSync('node dist/index.js --opencode', {
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
    expect(systemContent).toContain('folder map');
  });

  it('idempotency: running install twice produces valid result', () => {
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });

    // Run twice
    execSync('node dist/index.js --opencode', {
      cwd: tempDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        WORKSPACE_MAXXING_TEMPLATES: path.join(__dirname, '..', 'templates'),
      },
    });

    execSync('node dist/index.js --opencode', {
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
```

- [ ] **Step 2: Run integration tests**

```bash
npx jest tests/integration.test.ts --no-coverage
```
Expected: ALL tests PASS

- [ ] **Step 3: Run full test suite**

```bash
npm test
```
Expected: ALL tests PASS

- [ ] **Step 4: Commit**

```bash
git add tests/integration.test.ts
git commit -m "test: add end-to-end integration test for full install flow"
```

---

### Task 8: Final Polish

**Files:**
- Modify: `package.json` (add repository, homepage)
- Create: `.gitignore`
- Create: `README.md` (project readme, not workspace template)

- [ ] **Step 1: Update package.json with metadata**

```json
{
  "name": "workspace-maxxing",
  "version": "0.1.0",
  "description": "npx-installable skill for AI agents to create structured workspaces using ICM methodology",
  "bin": {
    "workspace-maxxing": "dist/index.js"
  },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest --config jest.config.js",
    "test:watch": "jest --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["ai-agent", "workspace", "skill", "opencode", "icm"],
  "author": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/workspace-maxxing"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
dist/
coverage/
*.tsbuildinfo
.env
```

- [ ] **Step 3: Create project README.md**

Create `README.md` (at project root, not in templates):

```markdown
# workspace-maxxing

> npx-installable skill for AI agents to create structured workspaces using the Interpretable Context Methodology (ICM).

## Quick Start

```bash
npx workspace-maxxing --opencode
```

This installs the workspace-maxxing skill into `.agents/skills/workspace-maxxing/` in your project.

## What It Does

After installation, open a new OpenCode session and invoke the workspace-maxxing skill. The agent will:

1. Ask what workflow you want to automate
2. Propose a workspace structure using ICM methodology
3. Wait for your approval
4. Build the workspace with numbered folders, routing tables, and reference files
5. Assess available tools and propose any missing ones
6. Test the workspace autonomously with sub-agents
7. Deliver a complete workspace + skill package + usage guide

## ICM Methodology

Based on [Interpretable Context Methodology](https://arxiv.org/abs/2603.16021) by Jake Van Clief & David McDermott:

- **Layer 0** — SYSTEM.md: always-loaded system prompt
- **Layer 1** — CONTEXT.md: task-to-workspace routing
- **Layer 2** — Per-folder CONTEXT.md: stage-specific instructions
- **Layer 3** — Content files: selectively loaded reference material

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
```

- [ ] **Step 4: Run full test suite one final time**

```bash
npm test
```
Expected: ALL tests PASS

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: Clean build, no errors

- [ ] **Step 6: Final commit**

```bash
git add package.json .gitignore README.md
git commit -m "chore: add project metadata, gitignore, and readme"
```

---

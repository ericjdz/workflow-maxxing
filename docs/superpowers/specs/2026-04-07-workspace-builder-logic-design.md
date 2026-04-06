# Workspace-Maxxing Design Spec — Sub-Project 2: Workspace Builder Logic

> **Phase 2 of 4:** Helper scripts + enhanced skill instructions. Subsequent phases add autonomous iteration and benchmarking.

## Context

Sub-Project 1 delivered the npx CLI that installs a SKILL.md and ICM workspace templates. Sub-Project 2 adds executable helper scripts that the agent uses to scaffold, validate, and install tools for workspaces — replacing manual file creation with reliable, programmatic generation.

## Architecture

### Components

#### 1. Scaffold Script (`scripts/scaffold.ts`)

Generates ICM-compliant workspace structures from a JSON plan.

**CLI Interface:**
```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

**What it creates:**
- `SYSTEM.md` (Layer 0) with folder map matching the provided stages
- `CONTEXT.md` (Layer 1) with routing table for each stage
- Numbered stage folders, each with a `CONTEXT.md` (Layer 2)
- `README.md` with usage instructions
- `00-meta/tools.md` for tool inventory

**Dependencies:** Node.js builtins only (`fs`, `path`, `process`)

#### 2. Validate Script (`scripts/validate.ts`)

Checks a workspace for ICM compliance.

**CLI Interface:**
```bash
node scripts/validate.ts --workspace ./workspace
```

**What it checks:**
- SYSTEM.md exists and contains a folder map
- CONTEXT.md exists at root level
- Every numbered folder has a CONTEXT.md
- No empty CONTEXT.md files
- One-way dependency compliance (downstream folders don't reference upstream in reverse)
- No duplicate content across files (canonical source check — basic heuristic: flags any identical text blocks > 50 characters found in multiple files)

**Output:** Prints pass/fail per check. Exit code 0 if all pass, 1 if any fail.

**Dependencies:** Node.js builtins only

#### 3. Install Tool Script (`scripts/install-tool.ts`)

Installs tools and updates workspace inventory.

**CLI Interface:**
```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

**What it does:**
- Runs the appropriate install command (`npm install`, `pip install`, etc.)
- Updates `00-meta/tools.md` with the tool name, version, and timestamp
- Supports managers: `npm`, `pip`, `npx` (global), `brew`

**Dependencies:** Node.js builtins + `child_process` for running install commands

#### 4. Enhanced SKILL.md

Updated to include:
- "## Available Scripts" section documenting all three scripts
- Examples of how to invoke each script
- Workflow: scaffold → validate → fix → install tools → validate → deliver
- When to use scripts vs. manual file creation (scripts for structure, manual for content)

### File Structure

```
workspace-maxxing/
├── src/
│   ├── scripts/
│   │   ├── scaffold.ts       — Scaffold script source
│   │   ├── validate.ts       — Validate script source
│   │   └── install-tool.ts   — Install tool script source
│   ├── index.ts              — Unchanged from Phase 1
│   └── install.ts            — Modified: also copies scripts/
├── templates/
│   ├── SKILL.md              — Enhanced with script instructions
│   └── .workspace-templates/
│       └── scripts/          — Scripts copied during install
│           ├── scaffold.ts
│           ├── validate.ts
│           └── install-tool.ts
├── tests/
│   ├── scaffold.test.ts
│   ├── validate.test.ts
│   └── install-tool.test.ts
```

### Data Flow

```
User: "Create a research workspace that outputs PDFs"
  │
  ▼
Agent reads SKILL.md → sees Available Scripts section
  │
  ▼
Agent proposes workspace structure to user
  │
  ▼
User approves
  │
  ▼
Agent runs: node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-pdf-export" --output ./workspace
  │
  ▼
Agent runs: node scripts/validate.ts --workspace ./workspace
  │
  ├─ If FAIL → Agent reads errors, fixes workspace, re-validates
  │
  ▼
Agent assesses tools → proposes pdf-lib, puppeteer, etc.
  │
  ▼
User approves
  │
  ▼
Agent runs: node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
  │
  ▼
Agent runs: node scripts/validate.ts --workspace ./workspace  (final check)
  │
  ▼
Deliver: workspace + USAGE.md
```

### Changes to Existing Files

**`src/install.ts`:** Add scripts directory to the copy list. When installing the skill, also copy `templates/.workspace-templates/scripts/` to the skill directory.

**`templates/SKILL.md`:** Add "## Available Scripts" section with usage examples for all three scripts.

### Error Handling

- **scaffold.ts:** Fails if output directory already exists (with `--force` flag to overwrite). Fails if stages list is empty or malformed.
- **validate.ts:** Never fails with exception — always returns structured output. Exit code indicates pass/fail.
- **install-tool.ts:** Fails if install command returns non-zero exit code. Reports error message from the package manager.

### Testing Strategy

- **scaffold.test.ts:** Verify correct folder structure is created, SYSTEM.md has correct folder map, CONTEXT.md files exist for each stage
- **validate.test.ts:** Create valid workspace → expect pass. Create invalid workspace (missing CONTEXT.md, empty files) → expect specific failures
- **install-tool.test.ts:** Mock child_process.execSync, verify correct command is run and tools.md is updated
- **Integration:** Run scaffold → validate → expect pass

### Scope

**In Scope (This Phase):**
- Three helper scripts (scaffold, validate, install-tool)
- Enhanced SKILL.md with script usage instructions
- Installer updated to copy scripts
- Tests for all three scripts

**Out of Scope (Future Phases):**
- Autonomous iteration engine (Phase 3)
- Sub-agent orchestration framework (Phase 3)
- Benchmark scoring system (Phase 4)
- Multi-agent support (Phase 4)
- Hill-climbing on scores (Phase 3)

### Success Criteria

1. `node scripts/scaffold.ts` creates valid ICM workspace from plan
2. `node scripts/validate.ts` correctly identifies valid and invalid workspaces
3. `node scripts/install-tool.ts` installs packages and updates inventory
4. Enhanced SKILL.md documents all scripts with examples
5. Installer copies scripts to skill directory
6. All tests pass (Phase 1 + Phase 2)

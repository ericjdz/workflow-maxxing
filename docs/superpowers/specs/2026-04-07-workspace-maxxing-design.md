# Workspace-Maxxing Design Spec

## Sub-Project 1: npx CLI + Base Skill

> **Phase 1 of 4:** Installer + skill foundation. Subsequent phases add workspace builder logic, autonomous iteration, and benchmarking.

## Context

Workspace-Maxxing is an npx-installable skill that enables AI coding agents (starting with OpenCode) to create, iterate on, and validate structured workspaces using the Interpretable Context Methodology (ICM) by Jake Van Clief. The workspace IS the skill — a folder structure with interconnected markdown files that doubles as an installable skill package.

**Inspired by:**
- [AutoAgent](https://github.com/kevinrgu/autoagent) — autonomous harness engineering via meta-agent iteration
- [ICM Paper](https://arxiv.org/abs/2603.16021) — folder structure as agentic architecture
- [Content-Agent-Routing-Promptbase](https://github.com/RinDig/Content-Agent-Routing-Promptbase) — layered routing architecture for AI context

## Architecture

### Layered Routing Model (ICM)

```
Layer 0 — SYSTEM.md (always loaded)
  ├── Folder map + ID systems
  ├── Core instructions for the agent
  └── ~800 tokens

Layer 1 — CONTEXT.md (routing table)
  ├── Maps tasks to workspaces
  └── ~300 tokens

Layer 2 — Workspace CONTEXT.md (per-folder)
  ├── What to load, in what order, for what task
  └── ~200-500 tokens each

Layer 3 — Content Files (selectively loaded)
  ├── Actual reference material
  └── ~500-3000 tokens each
```

### Core Principles

1. **Canonical Sources** — Every piece of information lives in exactly one place. Files point to data, never duplicate it.
2. **One-Way Dependencies** — A → B is fine. B → A creates O(n²) maintenance. If bidirectional, introduce C.
3. **Selective Section Loading** — Route to sections of files, not entire files. Load only what the task needs.
4. **Numbered Folders** — Represent workflow stages. 01-research → 02-draft → 03-review → 04-output.
5. **Routing ≠ Content** — CONTEXT.md files tell agents what to load. They don't contain the knowledge itself.

## System Design

### Components

#### 1. npx CLI (`src/index.ts`)

Entry point. Parses arguments, delegates to installer.

```
npx workspace-maxxing --opencode
```

- `--opencode` — installs skill into `.agents/skills/workspace-maxxing/`
- Future flags: `--claude`, `--copilot`, `--gemini`

#### 2. Installer (`src/install.ts`)

- Detects project root (nearest `.git` or `package.json`)
- Creates `.agents/skills/workspace-maxxing/` directory
- Copies `SKILL.md` and `.workspace-templates/` from package
- Idempotent: safe to run multiple times
- No runtime dependencies beyond Node.js builtins (`fs`, `path`)

#### 3. Skill File (`templates/SKILL.md`)

The core artifact. Instructions for OpenCode agents on how to:

- **Intent Capture:** Understand what workspace the user wants
- **Propose Structure:** Design workspace using ICM methodology
- **Human Approval Gate:** Present plan, wait for approval
- **Build Workspace:** Create numbered folders, markdown files, routing tables
- **Tool Assessment:** Scan available tools, propose installations, get approval
- **Autonomous Iteration:** After build, spawn sub-agents to test with diverse use cases, self-evaluate, update prompts, only involve human if confidence is low
- **Final Output:** Deliver workspace + skill package + usage guide

The SKILL.md must contain these sections:

```markdown
# Workspace-Maxxing Skill

## Role
You are a workspace architect. You create structured, ICM-compliant workspaces.

## Process
1. CAPTURE INTENT — Ask: "What workflow do you want to automate?"
2. PROPOSE STRUCTURE — Design workspace with numbered folders, CONTEXT.md routing files, canonical sources
3. GET APPROVAL — Present plan. Wait. Do not build until approved.
4. BUILD WORKSPACE — Create folders, markdown files, routing tables
5. ASSESS TOOLS — Scan environment. List available tools. Propose missing tools needed. Get approval.
6. INSTALL TOOLS — After approval, install proposed tools
7. TEST AUTONOMOUSLY — Spawn sub-agents with diverse test cases. Self-evaluate outputs.
8. ITERATE — Update system prompts based on test results. Only involve human if confidence is low.
9. DELIVER — Output: workspace folder + skill package + usage guide

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions
```

#### 4. Workspace Templates (`templates/.workspace-templates/`)

Base structure copied during install:

```
.workspace-templates/
├── SYSTEM.md              # Layer 0 template (always loaded)
├── CONTEXT.md             # Layer 1 routing template
└── workspace/             # Example workspace skeleton
    ├── 00-meta/
    │   └── CONTEXT.md     # Workspace-level routing
    ├── 01-input/
    │   └── CONTEXT.md
    ├── 02-process/
    │   └── CONTEXT.md
    ├── 03-output/
    │   └── CONTEXT.md
    └── README.md          # Usage guide template
```

### File Map (Project Structure)

```
workspace-maxxing/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # CLI entry point
│   └── install.ts         # File copying, path resolution
├── templates/
│   ├── SKILL.md           # Agent instructions (installed as skill)
│   └── .workspace-templates/
│       ├── SYSTEM.md      # Layer 0 template
│       ├── CONTEXT.md     # Layer 1 routing template
│       └── workspace/     # Workspace skeleton
│           ├── 00-meta/CONTEXT.md
│           ├── 01-input/CONTEXT.md
│           ├── 02-process/CONTEXT.md
│           ├── 03-output/CONTEXT.md
│           └── README.md
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-07-workspace-maxxing-design.md
```

### Data Flow

```
User runs: npx workspace-maxxing --opencode
    │
    ▼
CLI parses args → calls installer
    │
    ▼
Installer copies files to .agents/skills/workspace-maxxing/
    │
    ▼
User opens new OpenCode session, invokes skill
    │
    ▼
Agent reads SKILL.md → follows instructions:
    1. Captures user intent ("create a research workspace")
    2. Proposes workspace structure (ICM-based)
    3. User approves
    4. Agent builds workspace from templates + customization
    5. Agent assesses available tools, proposes installations
    6. User approves tool installations
    7. Agent installs tools
    8. Agent spawns sub-agents to test workspace
    9. Sub-agents self-evaluate, update prompts
    10. Human involved only if confidence is low
    11. Final output: workspace + skill package + usage guide
```

### Error Handling

- **Missing project root:** Warn user, install in current directory
- **Existing skill directory:** Overwrite with confirmation message
- **Failed file copy:** Abort, report which file failed, no partial state
- **Invalid flag:** Show usage help with supported flags

### Testing Strategy

- **CLI tests:** Verify `--opencode` flag creates correct directory structure
- **Installer tests:** Verify idempotency, correct file paths, no partial state on failure
- **Template validation:** Verify all template files exist and are non-empty
- **Integration test:** Run `npx workspace-maxxing --opencode` in temp directory, verify skill is loadable

## Scope

### In Scope (This Phase)

- npx CLI with `--opencode` flag
- Installer that copies skill files
- SKILL.md with complete agent instructions for workspace creation
- Workspace templates (ICM structure)
- Basic tool assessment instructions in SKILL.md

### Out of Scope (Future Phases)

- Autonomous iteration engine (Phase 3)
- Sub-agent orchestration framework (Phase 2)
- Benchmark scoring system (Phase 4)
- Multi-agent support --claude, --copilot, --gemini (Phase 4)
- Hill-climbing on scores (Phase 3)
- Human checkpoint UI (Phase 3)

## Success Criteria

1. `npx workspace-maxxing --opencode` installs a working skill
2. OpenCode agent can read the skill and understand how to build workspaces
3. Installed skill includes valid ICM-structured workspace templates
4. Running installer twice produces same result (idempotent)
5. Zero runtime dependencies beyond Node.js builtins

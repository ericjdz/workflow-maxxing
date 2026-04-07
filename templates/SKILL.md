---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', or 'iterate on this workspace'."
---

# Workspace-Maxxing Skill

## Overview

Autonomous workflow system that creates, validates, and improves ICM-compliant workspaces through phased execution and condition-driven improvement loops.

## When to Use

- User asks to build, create, or automate a workflow
- User asks to improve, validate, or iterate on an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

## The Iron Law

NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO IMPROVEMENT WITHOUT VALIDATION
NO COMPLETION CLAIM WITHOUT VERIFICATION

## Hybrid Flow

```
Phase 1: RESEARCH (dispatch research sub-skill)
  ↓
Phase 2: ARCHITECTURE (dispatch architecture sub-skill)
  ↓
Phase 3: BUILD (use scaffold.ts script)
  ↓
Phase 4: VALIDATE (dispatch validation sub-skill)
  ↓
Condition Loop (repeat until score > 85 AND all validations pass):
  ├─ If validation failed → dispatch validation sub-skill
  ├─ If score < 80 → dispatch prompt-engineering sub-skill
  ├─ If no tests exist → dispatch testing sub-skill
  ├─ If score plateaued → dispatch iteration sub-skill
  └─ If tools missing → dispatch tooling sub-skill
  ↓
Phase 5: DELIVER
```

## Sub-Skill Dispatch

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Validation failed | `validation` | Re-run validation sub-skill |
| Score < 80 | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| No tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Score plateaued | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

### scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

Options:
- `--name <name>` — Workspace name
- `--stages <s1,s2,...>` — Comma-separated stage folder names
- `--output <path>` — Where to create the workspace
- `--force` — Overwrite if output directory already exists

### validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

Exit code: 0 = all pass, 1 = some failed

### install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

Supported managers: `npm`, `pip`, `npx`, `brew`

### iterate.ts — Autonomous Iteration

Runs a 3-pass improvement loop: validate-fix → score → checklist.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

### generate-tests.ts — Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

### benchmark.ts — Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node scripts/benchmark.ts --workspace ./workspace
```

### dispatch.ts — Sub-Skill Dispatcher

Loads and executes sub-skill workflows.

```bash
node scripts/dispatch.ts --skill <name> --workspace ./workspace
```

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target > 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## Integration

- Sub-skills live in `skills/` directory, loaded via dispatch.ts
- Shared references in `references/` directory (anti-patterns, reporting-format, iron-laws)
- All sub-skills return structured JSON reports
- Condition loop continues until score > 85 AND all validations pass
- Escalate to human if stuck after 3 iteration attempts

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions

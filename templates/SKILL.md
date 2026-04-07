---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces using batched parallel sub-agents. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', 'iterate on this workspace', or 'run test cases'."
---

# Workspace-Maxxing Skill

## Overview

Autonomous workflow system that creates, validates, and improves ICM-compliant workspaces through phased execution, batched parallel sub-agent iteration, and condition-driven improvement loops.

## When to Use

- User asks to build, create, or automate a workflow
- User asks to improve, validate, or iterate on an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace
- User asks to run test cases against a workspace

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
  ->
Phase 2: ARCHITECTURE (dispatch architecture sub-skill)
  ->
Phase 3: BUILD (use scaffold.ts script)
  ->
Phase 4: VALIDATE (dispatch validation sub-skill)
  ->
Phase 5: AUTONOMOUS ITERATION (use orchestrator.ts)
  - Generate test cases
  - Split into batches
  - Dispatch workers in parallel per batch
  - Validate batch results
  - If score < threshold and failing test cases exist -> dispatch fixer sub-agents -> re-validate
  - If score < threshold and no actionable failing test cases exist -> failed/escalated outcome
  - Next batch or complete
  ->
Phase 6: DELIVER
```

## Autonomous Iteration Workflow

The orchestrator manages batched parallel sub-agent execution:

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85
```

**Flow:**
1. Generate test cases from workspace stages
2. Split into batches (default 3 per batch)
3. Dispatch worker sub-agents in parallel for each batch
4. Validate batch outputs with benchmark scoring
5. If batch score < threshold and failing test cases exist -> dispatch fixer sub-agents -> re-validate (max 3 retries)
6. If score remains < threshold and no actionable failing test cases exist -> mark batch failed/escalated
7. Move to next batch or write summary

**Options:**
- `--batch-size <n>` - Test cases per batch (default: 3)
- `--score-threshold <n>` - Minimum batch score to pass (default: 85)
- `--max-fix-retries <n>` - Max fix attempts per batch (default: 3)
- `--worker-timeout <s>` - Worker timeout in seconds (default: 300)

## Sub-Skill Dispatch

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Running autonomous iteration | (use orchestrator.ts) | `node scripts/orchestrator.ts --workspace ./workspace` |
| Worker execution | `worker` | `node scripts/dispatch.ts --skill worker --workspace ./workspace --batch-id <N>` |
| Fix loop | `fixer` | `node scripts/dispatch.ts --skill fixer --workspace ./workspace --batch-id <N>` |
| Manual condition loop only (not orchestrator batch loop): score < 85 due to prompt quality | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): no tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): score plateaued across full runs | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

### orchestrator.ts - Autonomous Batch Iteration

Runs the full batched parallel sub-agent workflow.

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85
```

### scaffold.ts - Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

### validate.ts - Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

### install-tool.ts - Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

### iterate.ts - Single-Workspace Iteration (legacy)

Runs a 3-pass improvement loop. Use orchestrator.ts for batched parallel iteration.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

### generate-tests.ts - Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

### benchmark.ts - Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node scripts/benchmark.ts --workspace ./workspace
```

### dispatch.ts - Sub-Skill Dispatcher

Loads and executes sub-skill workflows. Supports parallel dispatch.

```bash
node scripts/dispatch.ts --skill <name> --workspace ./workspace [--batch-id <N>] [--parallel --invocations <path>]
```

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target >= 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## Integration

- Sub-skills live in `skills/` directory, loaded via dispatch.ts
- Shared references in `references/` directory (anti-patterns, reporting-format, iron-laws)
- All sub-skills return structured JSON reports
- Orchestrator manages batch lifecycle with fix loops
- Condition loop continues until score >= 85 AND all validations pass
- Escalate to human if stuck after 3 iteration attempts

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A -> B, never B -> A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ - the built workspace
- .agents/skills/<workspace-name>/ - installable skill
- USAGE.md - how to use this workspace in future sessions
- .agents/iteration/summary.json - autonomous iteration results

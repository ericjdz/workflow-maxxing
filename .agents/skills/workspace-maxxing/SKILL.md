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
NO PRODUCT IMPLEMENTATION INSIDE WORKSPACE BUILDING MODE
NO STAGE SKIPPING ACROSS NUMBERED WORKFLOW FOLDERS

## Scope Guardrails

- This skill builds an ICM workflow workspace, not the end-product application.
- Keep outputs as file-structured markdown workflow artifacts in numbered stage folders.
- Do not generate backend/frontend/runtime code for the target domain while running this skill.
- If a user asks for product implementation details, capture them as workflow requirements and continue building the workspace structure.

## Sequential Enforcement

- Follow numbered stage folders in strict order; do not jump ahead.
- Use 00-meta/execution-log.md as the source of truth for stage completion state.
- A later stage is blocked until the previous stage is checked complete with evidence notes.

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
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<your-runner-command>"
```

**Flow:**
1. Generate test cases from workspace stages
2. Split into batches (default 3 per batch)
3. Dispatch worker sub-agents in parallel for each batch (external runner mode)
4. Validate batch outputs with benchmark scoring
5. If batch score < threshold and failing test cases exist -> dispatch fixer sub-agents -> re-validate (max 3 retries)
6. If score remains < threshold and no actionable failing test cases exist -> mark batch failed/escalated
7. Move to next batch or write summary

**Options:**
- `--batch-size <n>` - Test cases per batch (default: 3)
- `--score-threshold <n>` - Minimum batch score to pass (default: 85)
- `--max-fix-retries <n>` - Max fix attempts per batch (default: 3)
- `--worker-timeout <s>` - Worker timeout in seconds (default: 300)
- `--subagent-runner <command>` - External command template used to execute worker/fixer sub-agents; supports placeholders `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`

## Sub-Agent Iteration Contract

- True sub-agent mode requires `--subagent-runner` (or `WORKSPACE_MAXXING_SUBAGENT_RUNNER`) so worker/fixer test cases execute outside the orchestrator process.
- Worker/fixer execution MUST fail fast when no runner command is configured.
- Batch artifacts must include generated test cases, per-test-case reports, and summary evidence under `.agents/iteration/`.

## Sub-Agent Runner Contract

- Worker/fixer loops are external-runner-only in strict mode.
- The runner command template must support placeholders: `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`.
- Expected runner output is JSON with `{skill, status, timestamp, findings, recommendations, metrics, nextSkill}`.
- Non-JSON runner output is treated as a runner contract failure for worker/fixer execution.
- Use telemetry artifacts under `.agents/iteration/runs/` to diagnose command/rendering or payload issues.

## Sub-Skill Dispatch

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Running autonomous iteration | (use orchestrator.ts) | `node scripts/orchestrator.ts --workspace ./workspace --subagent-runner "<runner>"` |
| Worker execution | `worker` | `node scripts/dispatch.ts --skill worker --workspace ./workspace --batch-id <N> --runner-command "<runner {skill} {workspace} {batchId} {testCaseId}>"` |
| Fix loop | `fixer` | `node scripts/dispatch.ts --skill fixer --workspace ./workspace --batch-id <N> --runner-command "<runner {skill} {workspace} {batchId} {testCaseId}>"` |
| Manual condition loop only (not orchestrator batch loop): score < 85 due to prompt quality | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): no tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): score plateaued across full runs | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

### orchestrator.ts - Autonomous Batch Iteration

Runs the full batched parallel sub-agent workflow.

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<runner>"
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
- workspace/ - the built markdown-first workflow workspace
- .agents/skills/<workspace-name>/ - installable skill
- USAGE.md - how to use this workspace in future sessions
- .agents/iteration/summary.json - autonomous iteration results

## Creating Workspaces with Invokable Agents

The workspace-maxxing skill can now create both the workspace folder structure AND an invokable agent that can be called with `@` in the workspace.

### CLI Commands

```bash
# Create workspace WITH agent (default)
npx workspace-maxxing --create-workspace --workspace-name "Daily Digest" --stages "01-input,02-process,03-output"

# Create workspace WITHOUT agent (backward compatible)
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --no-agent

# Custom agent name
npx workspace-maxxing --create-workspace --workspace-name "AI News" --agent-name "@news-agent"

# Custom iteration settings
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --threshold 90 --max-iterations 5
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--create-workspace` | - | Enable workspace creation mode |
| `--workspace-name` | "My Workspace" | Name of the workspace |
| `--stages` | "01-input,02-process,03-output" | Comma-separated stage names |
| `--agent-name` | auto-generated (@workspace-name) | Custom agent name |
| `--no-agent` | false | Create workspace without agent |
| `--threshold` | 85 | Robustness threshold for agent iteration |
| `--max-iterations` | 3 | Max improvement cycles |

### What Gets Created

When you run with `--create-workspace`:

1. **ICM Workspace** - Folder structure with SYSTEM.md, CONTEXT.md, stage folders
2. **Invokable Agent** - Stored in `.agents/skills/@<name>/`
3. **Self-Improvement** - Agent runs through iteration loop until robustness >= threshold

### Agent Structure

```
workspace/
├── .agents/
│   └── skills/
│       └── @<name>/           # The invokable agent
│           ├── SKILL.md
│           ├── config.json
│           ├── prompts/
│           │   ├── system.md
│           │   └── tasks/
│           ├── tools/
│           └── tests/
├── 01-input/
├── 02-process/
├── 03-output/
├── SYSTEM.md
└── CONTEXT.md
```

### Invoking the Agent

After workspace is created, use `@` followed by the agent name:

- **OpenCode**: `@daily-digest`
- **Claude Code**: Via `.claude/skills/` directory
- **Copilot**: Via `.github/copilot-instructions/`
- **Gemini**: Via `.gemini/skills/` directory

### Agent Self-Improvement

When the agent is created, it runs through an iteration loop:

1. **Generate test cases** - Edge cases, empty states, varied inputs
2. **Validate** - Check agent handles each case properly
3. **Score** - Compute robustness score (0-100)
4. **Improve** - If score < threshold, update prompts to fix issues
5. **Repeat** - Until score >= threshold or max iterations reached

This ensures the delivered agent is robust for real-world use.

### Backward Compatibility

Existing workspace-maxxing behavior is unchanged:
- `--opencode`, `--claude`, `--copilot`, `--gemini` still install the skill
- Using `--no-agent` creates workspace-only (no agent)
- Default behavior (without `--no-agent`) includes agent creation

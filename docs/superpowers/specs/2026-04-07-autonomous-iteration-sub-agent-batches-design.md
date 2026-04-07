# Autonomous Iteration with Sub-Agent Batches — Design Spec

## Problem

The current iteration workflow is script-driven (`iterate.ts`) with sequential validate-fix-score loops. Sub-skills lack obra/superpowers patterns (no YAML frontmatter, trigger phrases, anti-rationalization tables, iron laws). The goal is a truly autonomous workflow where fresh-context sub-agents execute test cases in parallel batches, validated by a dedicated validator agent, with fix loops for failures.

## Solution

New `orchestrator.ts` script coordinates batched parallel worker sub-agents with validator checkpoints and fix loops. Three new sub-skills (`worker`, `fixer`, enhanced `validation`). All 7 existing sub-skills rewritten with obra/superpowers patterns. `dispatch.ts` extended for parallel invocation.

## Architecture

### Core Components

```
orchestrator.ts (new)
├── Generates test cases via generate-tests.ts
├── Splits into batches (configurable via --batch-size, default 3)
├── Dispatches worker sub-agents in parallel per batch
├── Collects outputs (file + JSON)
├── Dispatches validator sub-agent on batch results
└── If batch score < threshold → dispatches fixer sub-agents → re-validates → next batch
```

### New Sub-Skills

| Sub-Skill | Purpose | Trigger |
|-----------|---------|---------|
| `worker` | Executes a single test case against the workspace, produces output | "run test case", "execute workspace task" |
| `fixer` | Applies targeted fixes to failing test case outputs | "fix failing test", "improve output" |
| `validation` (enhanced) | Benchmarks batch outputs, returns structured score | "validate batch", "check results" |

### Extended Components

| Component | Change |
|-----------|--------|
| `dispatch.ts` | Added `--parallel` flag + `--batch-id` for grouped invocation |
| `SKILL.md` | New "Autonomous Iteration Workflow" section replacing old iterate.ts docs |
| All 7 existing sub-skills | Rewritten with obra patterns (YAML frontmatter, trigger phrases, anti-rationalization tables, iron laws) |

### Output Structure

```
.agents/iteration/
├── batch-01/
│   ├── tc-001/
│   │   ├── output.md          (worker output, human-readable)
│   │   ├── report.json        (structured JSON for validation)
│   │   └── fix-output.md      (fixer output if needed)
│   ├── tc-002/
│   └── batch-report.json      (validator benchmark results)
├── batch-02/
└── summary.json               (final aggregated results)
```

## Data Flow & Batch Lifecycle

### Full Flow

```
1. GENERATE
   orchestrator.ts → generate-tests.ts → tests.json

2. BATCH SPLIT
   tests.json → batches of N (default 3)

3. WORKER DISPATCH (parallel per batch)
   For each test case in batch:
     dispatch.ts --skill worker --test-case <id> --batch <N> --workspace <path>
     → reads workspace CONTEXT.md + test case
     → executes task, writes output.md + report.json

4. VALIDATOR DISPATCH
   dispatch.ts --skill validation --batch <N> --workspace <path>
   → reads all report.json files in batch directory
   → runs benchmark scoring
   → writes batch-report.json

5. FIX LOOP (if batch score < threshold)
   For each failing test case:
     dispatch.ts --skill fixer --test-case <id> --batch <N> --workspace <path>
     → reads validator findings + original output
     → applies fixes, overwrites output.md + report.json
   → re-run validator
   → repeat until passing or max retries (default 3)

6. NEXT BATCH or COMPLETE
   If all batches done → write summary.json
   If any batch escalated → report to human
```

### Key Interfaces

- **Worker input:** test case JSON + workspace path + batch ID
- **Worker output:** `output.md` (human-readable), `report.json` (structured: `{testCaseId, status, output, findings}`)
- **Validator input:** batch directory path + workspace path
- **Validator output:** `batch-report.json` (per-test scores, overall batch score, findings, fix suggestions)
- **Fixer input:** validator findings + original output path
- **Fixer output:** updated `output.md` + `report.json`

### Concurrency Model

- Workers within a batch run in parallel (via `dispatch.ts --parallel`)
- Batches run sequentially (validator must complete before next batch starts)
- Fix loop runs sequentially per batch (fixers parallel within a batch)

## Sub-Skill Design Pattern

All sub-skills follow this structure:

```yaml
---
name: <skill-name>
description: "<trigger-friendly description>"
triggers: ["<phrase1>", "<phrase2>"]
---
```

Then:
- **Overview** — one paragraph
- **When to Use / When Not to Use** — clear boundaries
- **The Iron Law** — 3-4 non-negotiable rules
- **The Process** — numbered steps
- **Anti-Rationalization Table** — common excuses vs reality
- **Sub-Skill Dispatch** (if applicable) — what to dispatch next
- **Report Format** — structured JSON schema

### New Sub-Skills Specifics

**`worker` SKILL.md:**
- Focus: read test case, load relevant workspace sections, execute task, produce output
- Iron Law: NO SKIPPING TEST CASE STEPS, NO MODIFYING WORKSPACE STRUCTURE, NO CLAIMING DONE WITHOUT OUTPUT
- Dispatches to: `validation` after output complete

**`fixer` SKILL.md:**
- Focus: read validator findings, identify root cause, apply minimal fix, re-validate
- Iron Law: NO BLIND RETRIES, NO COSMETIC FIXES, NO FIXING WHAT ISN'T BROKEN
- Dispatches to: `validation` after fix applied

**`validation` (enhanced) SKILL.md:**
- Focus: batch-level benchmark scoring, per-test findings, fix suggestions
- Iron Law: NO SCORE INFLATION, NO SKIPPING FAILURES, NO VALIDATING WITHOUT BENCHMARK
- Dispatches to: `fixer` if score < threshold, `orchestrator` if passing

## dispatch.ts Changes

- `--parallel` flag: spawns multiple sub-agent invocations concurrently
- `--batch-id` flag: tags outputs to batch directory
- Returns aggregated JSON when `--parallel` is used

## File Changes

### New Files
- `src/scripts/orchestrator.ts` — Batch orchestrator
- `templates/.workspace-templates/skills/worker/SKILL.md` — Worker sub-skill
- `templates/.workspace-templates/skills/fixer/SKILL.md` — Fixer sub-skill

### Modified Files
- `src/scripts/dispatch.ts` — Parallel dispatch, batch ID support
- `templates/SKILL.md` — New "Autonomous Iteration Workflow" section
- `templates/.workspace-templates/skills/validation/SKILL.md` — Enhanced with batch validation
- `templates/.workspace-templates/skills/iteration/SKILL.md` — Rewritten with obra patterns
- `templates/.workspace-templates/skills/research/SKILL.md` — Rewritten with obra patterns
- `templates/.workspace-templates/skills/architecture/SKILL.md` — Rewritten with obra patterns
- `templates/.workspace-templates/skills/testing/SKILL.md` — Rewritten with obra patterns
- `templates/.workspace-templates/skills/prompt-engineering/SKILL.md` — Rewritten with obra patterns
- `templates/.workspace-templates/skills/tooling/SKILL.md` — Rewritten with obra patterns

### New Test Files
- `tests/orchestrator.test.ts`
- `tests/dispatch-parallel.test.ts`
- `tests/worker-skill.test.ts`
- `tests/fixer-skill.test.ts`
- `tests/validation-enhanced.test.ts`

## Error Handling

- **Worker timeout:** If a worker doesn't complete within timeout (default 300s), mark test case as failed, continue with batch
- **Validator failure:** If validator can't parse outputs, escalate to human
- **Fix loop exhaustion:** After max retries (default 3), mark batch as partially failed, continue to next batch
- **Orchestrator crash:** Summary.json written at each batch boundary for recovery

## Testing Strategy

- **Unit tests:** orchestrator.ts batch splitting, dispatch.ts parallel invocation, report aggregation
- **Integration tests:** full batch lifecycle (generate → dispatch → validate → fix → complete)
- **Sub-skill tests:** each sub-skill's report format, trigger phrases, iron law compliance
- **Edge cases:** empty test case list, single test case, all failures, all passes, mixed results

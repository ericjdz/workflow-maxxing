---
name: fixer
description: "Applies targeted fixes to failing test case outputs. Use when fixing failed worker outputs, improving low-scoring results, or addressing validator findings."
triggers: ["fix failing test", "improve output", "address validation failure", "apply targeted fix"]
---

## Overview

Read validator findings and original worker output, identify the root cause of failure, apply the minimal fix needed, and prepare the case for re-validation. Each fixer runs with fresh context.

## When to Use

- Dispatched by orchestrator in a fix loop
- Validator identifies specific failures for a test case
- Worker output is incomplete, incorrect, or misaligned with expectations

## When Not to Use

- Generating new output from scratch (use worker sub-skill)
- Validating outputs (use validation sub-skill)
- Redesigning workspace structure (use architecture sub-skill)

## The Iron Law

NO BLIND RETRIES
NO COSMETIC FIXES
NO FIXING WHAT IS NOT BROKEN
NO CLAIMING FIX WITHOUT RE-VALIDATION

## The Process

1. **Read validator findings** - Load `batch-report.json` from the batch directory
2. **Read original output** - Load `output.md` and `report.json` from `.agents/iteration/batch-<N>/<testCaseId>/`
3. **Identify root cause** - Map each finding to a specific defect in the output
4. **Apply minimal fix** - Change only what is needed to resolve each finding
5. **Update output.md** - Write the fixed output for the same test case
6. **Write report.json** - Structured JSON with `{skill, status, timestamp, testCaseId, batchId, findings, fixesApplied, recommendations, metrics, nextSkill}`
7. **Dispatch validation** - Signal that the fix is ready for re-validation

## Agent-Driven Test-Case Generation (Required)

- **Agent ownership:** Test-cases MUST be discovered and authored by an agent using the workspace context. Do not rely on hardcoded script-generated test cases.
- **Where to write:** The agent must write the test-case bundle to `.agents/iteration/test-cases.json` inside the workspace before the orchestrator or validator dispatches workers. Validators and orchestrator flows will treat this file as the authoritative source of inputs for the iteration.
- **Discovery guidance:** Agents should inspect repo files (SYSTEM.md, CONTEXT.md, stage CONTEXTs, user prompts, examples, and any domain files) to infer realistic inputs, edge cases, and acceptance criteria. Test-cases should reflect actual workspace intent and cover positive, negative, and boundary cases.
- **Schema (minimal):** The file must be valid JSON and an array of objects with the following fields:

```json
[
  {
    "id": "tc-001",
    "title": "Short descriptive title",
    "input": {"type": "text", "payload": "..."},
    "expected": {"criteria": ["..."], "matcher": "contains|equals|schema"},
    "metadata": {"priority": "high|medium|low", "sourceHints": ["SYSTEM.md"]}
  }
]
```

- **Idempotence:** Agents may re-generate or refine the file across iterations, but each write must be complete (no partial artifacts) and timestamped inside the JSON if updated.
- **Signal readiness:** After creating `.agents/iteration/test-cases.json` the agent should also write a single-line marker file `.agents/iteration/.test-cases-ready` to avoid race conditions with orchestrators reading stdout.

## Enforcement Notes

- **Validator contract:** The validation step is expected to check for `.agents/iteration/test-cases.json` when running in agent-driven mode and fail fast if missing or malformed. This ensures the orchestrator cannot fall back to hardcoded script cases.
- **Orchestrator behavior:** When agent-driven mode is enabled, the orchestrator must prefer `.agents/iteration/test-cases.json` and should not call or rely on any built-in `generate-tests` script to produce authoritative inputs.
- **Audit trail:** Agents should include a `generatedBy` and `timestamp` field in the test-cases file to aid debugging and reproducibility.

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I will just re-run the worker logic" | Blind retries do not fix root causes. Address the findings directly. |
| "This looks better now" | Better is subjective. The fix must satisfy the validator criteria. |
| "I will fix other things while I am here" | Scope creep adds risk. Fix only what was flagged. |
| "The fix is obvious" | Obvious assumptions cause regressions. Tie every change to a finding. |
| "I do not need to re-validate" | Unvalidated fixes are guesses. Always dispatch validation. |

## Sub-Skill Dispatch

- After fix applied -> validation sub-skill

## Report Format

```json
{
  "skill": "fixer",
  "status": "passed|failed|escalated",
  "timestamp": "2026-04-08T00:00:00Z",
  "testCaseId": "tc-001",
  "batchId": 1,
  "findings": ["Missing expected acceptance criteria section"],
  "fixesApplied": ["Added acceptance criteria section from validator recommendation"],
  "recommendations": ["Run validation to confirm all findings are cleared"],
  "metrics": {
    "findingsAddressed": 1,
    "fixesApplied": 1
  },
  "nextSkill": "validation"
}
```

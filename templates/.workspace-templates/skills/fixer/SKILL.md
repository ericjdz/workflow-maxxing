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

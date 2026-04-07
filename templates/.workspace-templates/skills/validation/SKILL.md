---
name: validation
description: "Checks workspace ICM compliance and benchmarks batch outputs. Use when validating a workspace, checking compliance, running validation, benchmarking batch results, or after making changes to workspace structure."
triggers: ["validate batch", "check results", "run validation", "benchmark outputs", "check compliance"]
---

## Overview

Ensure workspace meets ICM standards and benchmark batch outputs through systematic validation. Validate both workspace structure and worker or fixer outputs before any completion claim.

## When to Use

- After workspace scaffolding
- After any structural change
- After worker batch completes
- After fixer applies fixes
- Before claiming delivery
- When score drops below threshold

## When Not to Use

- Generating outputs (use worker sub-skill)
- Fixing failures (use fixer sub-skill)
- Researching patterns (use research sub-skill)

## The Iron Law

NO SCORE INFLATION
NO SKIPPING FAILURES
NO VALIDATING WITHOUT BENCHMARK
NO PASSING WITHOUT EVIDENCE

## The Process

1. **Run validate.ts** - Execute `node scripts/validate.ts --workspace <path>`
2. **Parse validation results** - Read exit code and output; collect structural findings
3. **Check batch outputs** - For each test case in `.agents/iteration/batch-<N>/`, verify `output.md` and `report.json` exist
4. **Run benchmark.ts** - Execute `node scripts/benchmark.ts --workspace <path>` to compute benchmark scoring
5. **Aggregate scores** - Combine structural validation score and benchmark score into a single batch score
6. **Generate findings** - List failures with concrete fix suggestions mapped to each failing test case
7. **Write batch-report.json** - Structured JSON with `{skill, status, timestamp, batchId, findings, fixSuggestions, recommendations, metrics, nextSkill}` where `nextSkill` is one of `fixer`, `orchestrator`, or `none`

## Batch-Level Validation

When validating a batch:
- Read all `report.json` files in `.agents/iteration/batch-<N>/`
- Verify each worker or fixer output matches its test case expectations
- Calculate per-test-case pass/fail status
- Calculate overall batch score using benchmark weights
- If score < threshold, dispatch fixer with findings

## Red Flags

- Reporting inflated scores to force a pass
- Skipping failing findings because they look minor
- Running validation without benchmark evidence
- Returning a passing status without per-case verification

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "The score is close, I will round up" | Score inflation hides real problems. Report the true score. |
| "One failure does not matter" | Every failure matters. Report it and route it to fixer. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "The benchmark is too strict" | The benchmark is the standard. Meet it or escalate. |

## Sub-Skill Dispatch

- If batch score < threshold -> fixer sub-skill (`nextSkill = fixer`)
- If batch score >= threshold -> orchestrator (batch complete, `nextSkill = orchestrator`)
- If critical failures (for example missing SYSTEM.md) -> escalate to human and set `nextSkill = none`

## Report Format

```json
{
  "skill": "validation",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "batchId": 1,
  "findings": ["All required files present"],
  "fixSuggestions": ["No fixes required"],
  "recommendations": ["Proceed to next batch"],
  "metrics": {
    "score": 94,
    "benchmarkScore": 92,
    "itemsChecked": 18,
    "itemsPassed": 17,
    "testCasesPassed": 7,
    "testCasesFailed": 1
  },
  "nextSkill": "orchestrator"
}
```

Allowed `nextSkill` values: `fixer`, `orchestrator`, `none`.

## Integration

- Consumes worker and fixer reports from `.agents/iteration/batch-<N>/`.
- Produces `batch-report.json` that drives fixer routing or orchestrator continuation.

---
name: iteration
description: "Runs autonomous improvement loops with benchmark scoring. Use when score plateaued, deeper fixes needed, or after testing identifies patterns."
triggers: ["run improvement loop", "iterate on workspace", "deeper fixes", "score plateau"]
---

## Overview

Execute improvement loops until quality thresholds are met. Iteration applies systematic fixes when first-pass prompt improvements are not enough.

## When to Use

- Score is plateaued across runs
- Testing finds repeated failure patterns
- Validation failures persist after prompt-engineering
- The condition-driven improvement loop requires deeper fixes
- Latest benchmark score is strictly between 80 and 85 (`80 < score < 85`)
- Score is 80 or lower (`score <= 80`) after prompt-engineering stops improving

## When Not to Use

- For first-pass improvements (use prompt-engineering first)
- When workspace is new and untested (use testing first)
- When structural redesign is needed (use architecture)

## The Iron Law

NO CLAIMING IMPROVEMENT WITHOUT RE-RUNNING BENCHMARK
NO SKIPPING FIX SUGGESTIONS
NO INFINITE ITERATION LOOPS
NO SKIPPING ESCALATION WHEN STUCK

## The Process

1. **Run iterate.ts** - Execute `node scripts/iterate.ts --workspace <path> --max-retries 3`.
2. **Read benchmark results** - Parse score, fixSuggestions, and improvementPotential.
3. **Identify improvement areas** - Prioritize changes with highest impact.
4. **Apply fixes** - Address each suggestion systematically.
5. **Re-run iteration** - Verify score movement.
6. **Repeat until threshold** - Continue until score is 85 or higher (`score >= 85`) or no improvement is possible.
7. **Escalate if stuck** - If score remains below 85 after 3 attempts, escalate.

## Red Flags

- Improvement is claimed without fresh benchmark evidence
- Fix suggestions are ignored
- Loop runs beyond max retries
- Escalation is skipped despite stalled score

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I will just run it again" | Re-running without fixes wastes cycles. |
| "The score improved by one point" | Marginal gains are not enough. Target is 85 or higher. |
| "I will keep iterating until it works" | Maximum 3 attempts, then escalate. |

## Sub-Skill Dispatch

- `status = passed` (`score >= 85`) -> `nextSkill = none`.
- `status = failed` (`score < 85` after max retries) -> `nextSkill = none` and require human follow-up.
- `status = escalated` (critical blocker prevents safe continuation) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "iteration",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Resolved two repeated edge-case failures"],
  "recommendations": ["Run final validation and testing before delivery"],
  "metrics": {
    "scoreBefore": 81,
    "scoreAfter": 88,
    "iterationsRun": 2
  },
  "nextSkill": "none"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `none`.

## Integration

- Works after testing or prompt-engineering when quality is stuck.
- Hands final results back to validation and completion checks.

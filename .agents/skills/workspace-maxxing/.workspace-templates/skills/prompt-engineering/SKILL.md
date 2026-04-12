---
name: prompt-engineering
description: "Improves CONTEXT.md and SYSTEM.md prompts for better agent behavior. Use when workspace score is 80 or lower, prompts need improvement, or after validation identifies content gaps."
triggers: ["improve prompts", "fix content gaps", "optimize prompts", "clarify instructions"]
---

## Overview

Optimize workspace prompts for clarity, completeness, and agent guidance. Prompt engineering resolves content-level quality issues without structural redesign.

## When to Use

- Score is 80 or lower in benchmark results (`score <= 80`)
- Validation identifies missing or weak content
- Prompts are vague or incomplete
- Agent behavior does not match expectations

## When Not to Use

- For structural issues (use architecture or fixer)
- When workspace has no content yet (use worker)
- For dependency installation (use tooling)

## The Iron Law

NO COSMETIC CHANGES WITHOUT FUNCTIONAL IMPROVEMENT
NO CHANGING PROMPTS WITHOUT RE-VALIDATING
NO REMOVING CONTENT WITHOUT REPLACEMENT
NO CLAIMING IMPROVEMENT WITHOUT SCORE CHECK

## The Process

1. **Identify weak prompts** - Read benchmark findings and validation failures.
2. **Analyze current prompts** - Identify what is missing, vague, or contradictory.
3. **Apply prompt patterns** - Use clear structure, examples, constraints, and output format guidance.
4. **Update CONTEXT.md files** - Improve stage-specific instructions.
5. **Update SYSTEM.md if needed** - Improve folder map, rules, and tool inventory guidance.
6. **Re-run validation** - Verify improvements did not break compliance.
7. **Re-run benchmark** - Confirm score movement.

## Red Flags

- Cosmetic wording changes with no measurable improvement
- Prompt edits made without re-validation
- Content removed without replacement
- No before/after score comparison

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This wording change is enough" | Wording changes must produce functional improvement. |
| "I will remove vague sections" | Removing sections creates gaps. Improve, do not delete. |
| "The score did not change, but it is better" | No score change means no proven improvement. Iterate again. |

## Sub-Skill Dispatch

- `status = passed` (`scoreAfter > 80`) -> `nextSkill = testing`.
- `status = failed` (`scoreAfter <= 80` or no measurable improvement) -> `nextSkill = iteration`.
- `status = escalated` (requirements conflict or critical blocker) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "prompt-engineering",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Clarified output constraints in two stage prompts"],
  "recommendations": ["Run testing to verify edge-case behavior"],
  "metrics": {
    "scoreBefore": 74,
    "scoreAfter": 83,
    "promptsUpdated": 3
  },
  "nextSkill": "testing"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `testing`, `iteration`, `none`.

## Integration

- Consumes findings from validation and benchmark.
- Produces higher-quality prompt content for testing and iteration.

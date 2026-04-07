---
name: prompt-engineering
description: "Improves CONTEXT.md and SYSTEM.md prompts for better agent behavior. Use when workspace score is below 80, prompts need improvement, or after validation identifies content gaps."
---

## Overview

Optimize workspace prompts for clarity, completeness, and agent guidance.

## When to Use

- Score < 80 in benchmark results
- Validation identifies missing content
- Prompts are vague or incomplete
- Agent behavior doesn't match expectations

## The Process

1. **Identify weak prompts** — Read benchmark findings and validation failures
2. **Analyze current prompts** — What's missing, vague, or unclear?
3. **Apply prompt patterns** — Use clear structure, examples, constraints, and output formats
4. **Update CONTEXT.md files** — Improve stage-specific instructions
5. **Update SYSTEM.md if needed** — Improve folder map, rules, or tool inventory
6. **Re-run validation** — Verify improvements didn't break anything
7. **Re-run benchmark** — Check if score improved

## Red Flags

- Making cosmetic changes without functional improvement
- Changing prompts without re-validating
- Removing content instead of improving it
- Not checking if score actually improved

## Report Format

```json
{
  "skill": "prompt-engineering",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>,
    "scoreBefore": <number>,
    "scoreAfter": <number>
  },
  "nextSkill": "testing|iteration|none"
}
```

## Integration

- Dispatched when score < 80
- After improvements → dispatch testing to verify
- If score doesn't improve → dispatch iteration for deeper fixes

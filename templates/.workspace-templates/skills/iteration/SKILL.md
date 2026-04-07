---
name: iteration
description: "Runs autonomous improvement loops with benchmark scoring. Use when score plateaued, deeper fixes needed, or after testing identifies patterns."
---

## Overview

Execute improvement loops until quality thresholds are met.

## When to Use

- Score plateaued (no improvement between runs)
- Testing identified patterns requiring deeper fixes
- Validation failures persist after prompt-engineering
- As part of the condition-driven improvement loop

## The Process

1. **Run iterate.ts** — Execute `node scripts/iterate.ts --workspace <path> --max-retries 3`
2. **Read benchmark results** — Parse the JSON output
3. **Identify improvement areas** — Read fixSuggestions and improvementPotential
4. **Apply fixes** — Address each suggestion systematically
5. **Re-run iteration** — Check if score improved
6. **Repeat until threshold** — Continue until score > 85 or no improvement possible
7. **Escalate if stuck** — If score doesn't improve after 3 attempts, escalate to human

## Red Flags

- Claiming improvement without re-running benchmark
- Skipping fix suggestions
- Infinite iteration loops (always re-run with max 3 attempts)
- Not escalating when stuck

## Report Format

```json
{
  "skill": "iteration",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>,
    "iterationsRun": <number>,
    "scoreBefore": <number>,
    "scoreAfter": <number>
  },
  "nextSkill": "none"
}
```

## Integration

- Dispatched when score plateaued
- After iteration → re-run validation and benchmark
- If score > 85 → workflow complete
- If stuck after 3 attempts → escalate to human

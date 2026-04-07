---
name: validation
description: "Checks workspace ICM compliance, runs validate.ts, and reports findings. Use when validating a workspace, checking compliance, running validation, or after making changes to workspace structure."
---

## Overview

Ensure workspace meets ICM standards through systematic validation.

## When to Use

- After workspace scaffolding
- After any structural change
- Before claiming delivery
- When score drops below threshold

## The Process

1. **Run validate.ts** — Execute `node scripts/validate.ts --workspace <path>`
2. **Parse results** — Read exit code and output
3. **Check CONTEXT.md files** — Verify each numbered folder has non-empty CONTEXT.md
4. **Check SYSTEM.md** — Verify folder map and rules exist
5. **Check routing table** — Verify CONTEXT.md references all numbered folders
6. **Generate report** — Output structured JSON report

## Red Flags

- Empty CONTEXT.md files
- Missing SYSTEM.md
- Routing table doesn't match folder structure
- Duplicate content across files
- validate.ts exit code 1

## Report Format

```json
{
  "skill": "validation",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>
  },
  "nextSkill": "prompt-engineering|iteration|none"
}
```

## Integration

- If validation fails → recommend prompt-engineering to fix content gaps
- If validation passes → recommend testing sub-skill
- If critical failures (missing SYSTEM.md) → escalate to human

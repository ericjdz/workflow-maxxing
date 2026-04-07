---
name: testing
description: "Generates and runs test cases, evaluates results, and identifies gaps. Use when testing workspace quality, generating test cases, or after prompt improvements."
---

## Overview

Verify workspace quality through systematic testing.

## When to Use

- After prompt-engineering improvements
- When no tests exist for the workspace
- Before claiming delivery
- When score is above 80 but quality is uncertain

## The Process

1. **Generate test cases** — Run `node scripts/generate-tests.ts --workspace <path> --output ./tests.json`
2. **Read test cases** — Parse the generated test cases
3. **Run generation tests** — For each test case, create sample content the stage should produce
4. **Run evaluation tests** — Review CONTEXT.md files against test cases
5. **Aggregate results** — Identify patterns and gaps
6. **Document findings** — Create test report with pass/fail per test case

## Red Flags

- Skipping test generation
- Not running both generation and evaluation tests
- Ignoring failed test cases
- Not documenting patterns in failures

## Report Format

```json
{
  "skill": "testing",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>,
    "testCasesGenerated": <number>,
    "testCasesPassed": <number>
  },
  "nextSkill": "iteration|none"
}
```

## Integration

- Dispatched after prompt-engineering
- If tests fail → dispatch iteration for fixes
- If tests pass → workflow is nearly complete

---
name: testing
description: "Generates and runs test cases, evaluates results, and identifies gaps. Use when testing workspace quality, generating test cases, or after prompt improvements."
triggers: ["generate test cases", "run tests", "test workspace", "evaluate quality"]
---

## Overview

Verify workspace quality through systematic testing. Testing confirms outputs across sample, edge-case, and empty-input scenarios.

## When to Use

- After prompt-engineering improvements
- When no tests exist for the workspace
- Before claiming delivery
- When benchmark score is strictly between 80 and 85 (`80 < score < 85`)
- When score is 85 or higher and final evidence is still required

## When Not to Use

- Before workspace build is complete (run scaffold.ts first)
- For structural validation (use validation sub-skill)
- When applying direct fixes to failures (use fixer sub-skill)
- When benchmark score is 80 or lower (`score <= 80`) (use prompt-engineering first)

## The Iron Law

NO SKIPPING TEST GENERATION
NO IGNORING FAILED TESTS
NO CLAIMING QUALITY WITHOUT EVIDENCE
NO TESTING WITHOUT TEST CASES

## The Process

1. **Generate test cases** - Instead of using scripts, author `.agents/iteration/test-cases.json` manually based on workspace criteria.
2. **Read test cases** - Parse generated test cases and expected outcomes.
3. **Run generation tests** - Produce sample content each stage should output.
4. **Run evaluation tests** - Review CONTEXT.md files against expected behavior.
5. **Aggregate results** - Identify recurring patterns and quality gaps.
6. **Document findings** - Create a pass/fail report per test case.

## Agent-Driven Test-Case Generation (Required)

- **Agent ownership:** Test-cases MUST be discovered and authored by an agent using the workspace context. Do not rely on hardcoded script-generated test cases.
- **Where to write:** The agent must write the test-case bundle to `.agents/iteration/test-cases.json` inside the workspace before the orchestrator or validator dispatches workers.
- **Discovery guidance:** Agents should inspect repo files (SYSTEM.md, CONTEXT.md, stage CONTEXTs, user prompts, examples, and any domain files) to infer realistic inputs, edge cases, and acceptance criteria.
- **Schema (minimal):** The file must be valid JSON and an array of objects with the following fields:

```json
[
  {
    "id": "tc-001",
    "stage": "01-input",
    "type": "sample",
    "input": "...",
    "expected": "..."
  }
]
```

- **Idempotence:** Agents may re-generate or refine the file across iterations, but each write must be complete and timestamped.
- **Signal readiness:** After creating `.agents/iteration/test-cases.json`, write a single-line marker file `.agents/iteration/.test-cases-ready`.

## Red Flags

- Test generation is skipped
- Generation tests run without evaluation tests
- Failed test cases are ignored
- Failure patterns are undocumented

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "The workspace looks fine, no need to test" | Looks can deceive. Tests reveal behavior. |
| "One failed test is a fluke" | Failed tests are signals. Investigate each one. |
| "I will test after delivery" | Untested delivery is a gamble. Test first. |

## Sub-Skill Dispatch

- `status = passed` (all required tests pass and `benchmarkScore >= 85`) -> `nextSkill = none`.
- `status = failed` (any required test fails or `benchmarkScore < 85`) -> `nextSkill = iteration`.
- `status = escalated` (testing cannot run reliably due to blockers) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "testing",
  "status": "failed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Two edge-case outputs failed acceptance checks"],
  "recommendations": ["Run iteration to address repeated edge-case defects"],
  "metrics": {
    "benchmarkScore": 82,
    "testCasesGenerated": 9,
    "testCasesPassed": 7,
    "testCasesFailed": 2
  },
  "nextSkill": "iteration"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `iteration`, `none`.

## Integration

- Uses generate-tests.ts output as primary test input.
- Supplies pass/fail evidence for iteration and final verification.

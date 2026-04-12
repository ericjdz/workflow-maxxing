---
name: worker
description: "Executes a single test case against the workspace and produces output. Use when running test cases, executing workspace tasks, or processing stage-specific work."
triggers: ["run test case", "execute workspace task", "process stage", "generate output"]
---

## Overview

Execute a single test case by reading the relevant workspace sections, performing the required work, and producing structured output. Each worker runs with fresh context - no assumptions about prior runs.

## When to Use

- Dispatched by orchestrator as part of a batch
- User asks to run a specific test case
- User asks to execute a workspace stage task

## When Not to Use

- Validating outputs (use validation sub-skill)
- Fixing failed outputs (use fixer sub-skill)
- Planning workspace structure (use architecture sub-skill)

## The Iron Law

NO SKIPPING TEST CASE STEPS
NO MODIFYING WORKSPACE STRUCTURE
NO CLAIMING DONE WITHOUT OUTPUT
NO ASSUMING PRIOR CONTEXT

## The Process

1. **Read test case** - Load the test case JSON from `.agents/iteration/batch-<N>/<testCaseId>/` or orchestrator input
2. **Load workspace context** - Read `SYSTEM.md` and relevant stage `CONTEXT.md` files
3. **Execute the task** - Follow the test case input/expected instructions
4. **Write output.md** - Human-readable output in `.agents/iteration/batch-<N>/<testCaseId>/output.md`
5. **Write report.json** - Structured JSON with `{skill, status, timestamp, testCaseId, batchId, findings, recommendations, metrics, nextSkill}`
6. **Dispatch validation** - Signal that output is ready for validation

## External Runner Contract

- Worker execution in autonomous iteration is orchestrated via `--subagent-runner`.
- Direct worker dispatch must provide `--runner-command` with placeholders `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`.
- Runner output must be JSON and include `report.json` compatible fields:
  - `skill`, `status`, `timestamp`, `findings`, `recommendations`, `metrics`, `nextSkill`
- Missing/invalid runner output is a failure, not a simulated success path.
- Use `.agents/iteration/runs/*.json` telemetry to debug command rendering and runner payload issues.

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I already know what this stage does" | Read the CONTEXT.md. Assumptions cause failures. |
| "The output is good enough" | Good enough fails validation. Follow the test case exactly. |
| "I'll modify the workspace structure to make this easier" | Workers don't modify structure. That's the fixer's job. |
| "This test case is redundant" | Every test case exists for a reason. Execute it. |
| "I'll skip writing report.json" | Validation depends on report.json. It's mandatory. |

## Sub-Skill Dispatch

- After output complete -> validation sub-skill

## Report Format

```json
{
  "skill": "worker",
  "status": "passed|failed|escalated",
  "timestamp": "2026-04-08T00:00:00Z",
  "testCaseId": "tc-001",
  "batchId": 1,
  "findings": ["Output generated with required sections"],
  "recommendations": ["Proceed to validation"],
  "metrics": {
    "executionTimeMs": 120,
    "outputLength": 640
  },
  "nextSkill": "validation"
}
```
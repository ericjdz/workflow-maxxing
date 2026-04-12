# Session 294c Sub-Agent Invocation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate simulated worker/fixer loops and enforce true agent-driven execution with strict runner contracts, canonical test-case inputs, and reliable quality gates.

**Architecture:** Keep the current scaffold/dispatch/orchestrator architecture, but replace implicit simulated fallback behavior with strict external runner contracts for worker/fixer execution. Make `.agents/iteration/test-cases.json` authoritative, enforce readiness and schema checks, and block completion when validation or threshold gates are not met.

**Tech Stack:** TypeScript, Node.js (`fs`, `path`, `child_process`), Jest.

---

## File Responsibility Map

- `src/scripts/dispatch.ts`: strict worker/fixer runner behavior, command rendering, telemetry capture.
- `src/scripts/orchestrator.ts`: canonical test-case loading, strict gating, summary consistency checks.
- `src/scripts/validate.ts`: enforce agent-generated test-case and readiness-marker schema.
- `src/scripts/generate-tests.ts`: fallback-only behavior and explicit warnings (non-authoritative path).
- `tests/dispatch.test.ts`: runner contract tests and failure-path tests.
- `tests/dispatch-parallel.test.ts`: batch dispatch behavior under strict runner mode.
- `tests/orchestrator.test.ts`: canonical test-case loading, strict fail conditions, consistency checks.
- `tests/validate.test.ts`: schema/readiness checks and blocking behavior.
- `tests/integration.test.ts`: end-to-end agent-driven scenario.
- `templates/SKILL.md`: root workflow contract wording.
- `templates/.workspace-templates/skills/worker/SKILL.md`: explicit runner and output contract.
- `templates/.workspace-templates/skills/fixer/SKILL.md`: explicit runner and output contract.
- `README.md`: npx usage and external runner examples.

---

### Task 1: Make Worker/Fixer Dispatch Strict (No Silent Simulation)

**Files:**
- Modify: `tests/dispatch.test.ts`
- Modify: `tests/dispatch-parallel.test.ts`
- Modify: `src/scripts/dispatch.ts`

- [ ] **Step 1: Write failing tests for strict worker/fixer behavior**

Add tests asserting:
- `dispatchSkill('worker', ...)` fails without `runnerCommand`.
- `dispatchSkill('fixer', ...)` fails without `runnerCommand`.
- Non-worker skills (`research`, `architecture`) may still load without runner.

- [ ] **Step 2: Run tests to confirm failure**

Run:
```bash
npm test --silent -- tests/dispatch.test.ts tests/dispatch-parallel.test.ts
```
Expected: worker/fixer tests fail because current fallback reports simulated pass.

- [ ] **Step 3: Implement strict logic in `dispatch.ts`**

Implement guard:
```ts
const requiresExternalRunner = skillName === 'worker' || skillName === 'fixer';
if (requiresExternalRunner && !options.runnerCommand) {
  return createRunnerFailureReport(skillName, 'External sub-agent runner is required for worker/fixer', 'none');
}
```

- [ ] **Step 4: Re-run tests and verify pass**

Run same test command and expect PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/dispatch.ts tests/dispatch.test.ts tests/dispatch-parallel.test.ts
git commit -m "fix(dispatch): enforce external runner for worker/fixer"
```

---

### Task 2: Enforce Canonical Agent Test-Case Source in Orchestrator

**Files:**
- Modify: `tests/orchestrator.test.ts`
- Modify: `src/scripts/orchestrator.ts`

- [ ] **Step 1: Add failing tests for canonical input source**

Add tests asserting:
- Orchestrator prefers `.agents/iteration/test-cases.json` when present.
- Orchestrator rejects malformed/non-array payloads.
- Orchestrator fails when required metadata (`id`, `input`, `expected`) is missing.

- [ ] **Step 2: Run orchestrator tests and confirm failure**

```bash
npm test --silent -- tests/orchestrator.test.ts
```

- [ ] **Step 3: Implement canonical-source parsing and schema checks**

In `runBatchLifecycle`:
- Load `.agents/iteration/test-cases.json` first.
- Validate each item has required minimal contract.
- Persist normalized IDs and reject duplicates.

- [ ] **Step 4: Re-run tests and verify pass**

```bash
npm test --silent -- tests/orchestrator.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/scripts/orchestrator.ts tests/orchestrator.test.ts
git commit -m "feat(orchestrator): enforce canonical agent test-cases contract"
```

---

### Task 3: Harden Validation for Agent-Generated Inputs

**Files:**
- Modify: `tests/validate.test.ts`
- Modify: `src/scripts/validate.ts`

- [ ] **Step 1: Add failing tests for readiness and schema checks**

Add tests asserting validation fails when:
- `.agents/iteration/test-cases.json` is missing.
- `.agents/iteration/.test-cases-ready` is missing.
- JSON cannot parse.
- Item schema is missing required fields.

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test --silent -- tests/validate.test.ts
```

- [ ] **Step 3: Implement validator checks and precise error messages**

Add checks:
- `test-cases.json exists`
- `test-cases.json parseable`
- `test-cases.json items valid`
- `.test-cases-ready exists`

- [ ] **Step 4: Re-run tests and verify pass**

```bash
npm test --silent -- tests/validate.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/scripts/validate.ts tests/validate.test.ts
git commit -m "feat(validate): require agent-generated test-case readiness and schema"
```

---

### Task 4: Add Runner Telemetry for Debuggability

**Files:**
- Modify: `tests/dispatch.test.ts`
- Modify: `src/scripts/dispatch.ts`

- [ ] **Step 1: Add failing tests for telemetry artifact creation**

Add tests asserting that each worker/fixer runner invocation writes telemetry with:
- rendered command
- elapsed time
- exit code
- stdout/stderr capture summary

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test --silent -- tests/dispatch.test.ts
```

- [ ] **Step 3: Implement telemetry writer**

Write under:
- `.agents/iteration/runs/<timestamp>-<skill>-<batchId>-<testCaseId>.json`

Include bounded stdout/stderr to avoid large files.

- [ ] **Step 4: Re-run tests**

```bash
npm test --silent -- tests/dispatch.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/scripts/dispatch.ts tests/dispatch.test.ts
git commit -m "feat(dispatch): persist runner telemetry artifacts"
```

---

### Task 5: Align Skills and README with True Agent-Driven Contract

**Files:**
- Modify: `templates/SKILL.md`
- Modify: `templates/.workspace-templates/skills/worker/SKILL.md`
- Modify: `templates/.workspace-templates/skills/fixer/SKILL.md`
- Modify: `README.md`

- [ ] **Step 1: Add explicit runner contract text**

Document:
- worker/fixer require external runner
- expected JSON output schema
- required placeholders
- no simulated completion semantics

- [ ] **Step 2: Add Windows-safe and POSIX-safe runner examples**

Include `npx` examples that actually spawn an external agent command, not dispatch recursion.

- [ ] **Step 3: Add a failing docs test (if docs assertions exist)**

If repository has template docs tests, add assertions for new contract headings.

- [ ] **Step 4: Run related tests**

```bash
npm test --silent -- tests/templates.test.ts tests/templates-enhanced.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add templates/SKILL.md templates/.workspace-templates/skills/worker/SKILL.md templates/.workspace-templates/skills/fixer/SKILL.md README.md tests/templates.test.ts tests/templates-enhanced.test.ts
git commit -m "docs(skill): codify true agent-driven runner contract"
```

---

### Task 6: Add Integration Coverage for Session 294c Failure Class

**Files:**
- Modify: `tests/integration.test.ts`

- [ ] **Step 1: Add failing integration cases**

Add tests for:
- worker/fixer without runner must fail.
- dispatch-recursion runner command does not count as true sub-agent success.
- orchestrator refuses completion claims under threshold.

- [ ] **Step 2: Run integration tests and confirm fail**

```bash
npm test --silent -- tests/integration.test.ts
```

- [ ] **Step 3: Implement minimal code updates required for passing behavior**

Adjust orchestrator/dispatch gating logic and completion condition checks.

- [ ] **Step 4: Re-run integration tests**

```bash
npm test --silent -- tests/integration.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add tests/integration.test.ts src/scripts/dispatch.ts src/scripts/orchestrator.ts
git commit -m "test(integration): cover real sub-agent execution gates"
```

---

### Task 7: Full Verification and Release Readiness

**Files:**
- Modify if needed: any touched files from previous tasks

- [ ] **Step 1: Run full build and test suite**

```bash
npm run build
npm test --silent
```

- [ ] **Step 2: Verify key runtime command against fresh desktop workspace**

```bash
node dist/scripts/orchestrator.js --workspace "<fresh-workspace>" --subagent-runner "<real-runner-command>"
```
Expected:
- worker/fixer invocations produce telemetry artifacts
- summary reflects real runner results

- [ ] **Step 3: Document verification evidence in PR/commit notes**

Capture:
- command outputs
- pass/fail counts
- sample telemetry file path

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize sub-agent invocation hardening and verification"
```

---

## Self-Review Checklist

- [ ] Every defect tag from the spec maps to at least one implementation task.
- [ ] No task depends on implicit simulated worker/fixer behavior.
- [ ] Completion criteria require both validation and benchmark gates.
- [ ] Integration coverage includes the session-294c failure pattern.

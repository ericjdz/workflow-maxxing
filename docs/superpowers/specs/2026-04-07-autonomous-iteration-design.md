# Workspace-Maxxing Design Spec — Sub-Project 3: Autonomous Iteration & Validation

> **Phase 3 of 4:** Autonomous iteration engine + sub-agent orchestration. Phase 4 adds benchmarking and multi-agent support.

## Context

Sub-Project 1 delivered the npx CLI with skill installation. Sub-Project 2 added helper scripts (scaffold, validate, install-tool) for programmatic workspace creation. Sub-Project 3 adds autonomous iteration — the agent self-tests, self-evaluates, and improves the workspace without human involvement, escalating only when stuck.

## Architecture

### Data Flow

```
Agent scaffolds workspace → runs iterate.ts
  │
  ├─ Pass 1: Validate-Fix Loop
  │   ├─ Run validate.ts
  │   ├─ If failures → fix specific issues → re-validate
  │   └─ Repeat until pass OR max retries (3) → escalate to human
  │
  ├─ Pass 2: Score-Driven Content Quality
  │   ├─ Score workspace (structure + content quality, 0-100)
  │   ├─ Identify lowest-scoring areas
  │   └─ Agent improves content, re-scores until plateau
  │
  ├─ Pass 3: Completeness Checklist
  │   ├─ Check: every stage has inputs/outputs/dependencies
  │   ├─ Check: routing table references all folders
  │   └─ Agent fills gaps
  │
  └─ Sub-Agent Testing (agent-orchestrated via SKILL.md)
      ├─ Agent runs generate-tests.ts to create test cases
      ├─ Agent spawns sub-agents: half generate, half evaluate
      ├─ Results aggregated → agent reviews
      └─ If confidence low → escalate to human
```

### Components

#### 1. Iterate Script (`scripts/iterate.ts`)

Orchestrates the 3-pass improvement loop.

**CLI Interface:**
```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

**Pass 1: Validate-Fix Loop**
- Runs `validate.ts` programmatically (imports the module, not shell)
- If failures exist, returns structured error details to the agent
- Retries up to `--max-retries` times (default 3)
- If still failing after max retries, returns `{ escalate: true }` with failure details
- The agent reads the output and attempts fixes between retries

**Pass 2: Score-Driven Content Quality**
- Scores workspace on a 0-100 scale using these criteria:
  - SYSTEM.md quality (has role, folder map, rules) — 20 points
  - CONTEXT.md quality (has routing table, references all stages) — 20 points
  - Each stage CONTEXT.md has purpose, inputs, outputs, dependencies — 15 points per stage (capped at 45 total for 3 stages)
  - tools.md exists and has content — 15 points
- Identifies lowest-scoring areas and reports them
- Agent improves content between score runs

**Pass 3: Completeness Checklist**
- Fixed checklist of structural requirements:
  - Every stage has inputs defined
  - Every stage has outputs defined
  - Every stage has dependencies defined
  - Routing table references all numbered folders
  - README.md exists and has usage instructions
- Reports pass/fail per item

**Output:** JSON to stdout with structured results:
```json
{
  "passes": {
    "validate": { "status": "passed", "retries": 1 },
    "score": { "score": 78, "improvements": ["01-input missing dependencies"] },
    "checklist": { "items": 5, "passed": 5, "failed": 0 }
  },
  "escalate": false
}
```

**Dependencies:** Node.js builtins only (`fs`, `path`, `process`). Imports `validateWorkspace` from `validate.ts` directly.

#### 2. Generate Tests Script (`scripts/generate-tests.ts`)

Generates test cases for workspace evaluation.

**CLI Interface:**
```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

**What it generates:**
- For each numbered stage folder: 2-3 test cases
- Test case types: `sample` (normal input), `edge-case` (boundary conditions), `empty` (missing input)
- Each test case includes: stage name, type, sample input, expected output description

**Output:** JSON file at `--output` path:
```json
{
  "workspace": "research",
  "testCases": [
    {
      "stage": "01-input",
      "type": "sample",
      "input": "A research question about climate change",
      "expected": "Stage should collect and validate the research question"
    },
    {
      "stage": "01-input",
      "type": "edge-case",
      "input": "",
      "expected": "Stage should handle empty input gracefully"
    }
  ]
}
```

**Dependencies:** Node.js builtins only

#### 3. Enhanced SKILL.md

Updated to include "## Autonomous Iteration" section with:
- Instructions for running `iterate.ts` and interpreting results
- How to fix validation failures between retries
- How to improve scores between scoring runs
- How to fill checklist gaps
- Sub-agent spawning instructions:
  - Run `generate-tests.ts` to create test cases
  - Split test cases: half for generation sub-agents, half for evaluation sub-agents
  - Generation sub-agents: create sample content for assigned test cases
  - Evaluation sub-agents: review workspace against assigned test cases
  - Aggregate results, assess confidence
- Escalation criteria: present failures to human with proposed fix

### File Structure

```
workspace-maxxing/
├── src/
│   ├── scripts/
│   │   ├── iterate.ts          — Orchestration script source
│   │   └── generate-tests.ts   — Test case generator source
│   ├── index.ts                — Unchanged
│   └── install.ts              — Modified: also copies new scripts
├── templates/
│   ├── SKILL.md                — Enhanced with autonomous iteration
│   └── .workspace-templates/
│       └── scripts/
│           ├── iterate.ts      — Copy for distribution
│           └── generate-tests.ts — Copy for distribution
├── tests/
│   ├── iterate.test.ts
│   └── generate-tests.test.ts
```

### Changes to Existing Files

**`src/install.ts`:** Add `iterate.ts` and `generate-tests.ts` to the scripts copy list.

**`templates/SKILL.md`:** Add "## Autonomous Iteration" section with full instructions.

### Error Handling

- **iterate.ts:** Never crashes with unhandled exception. If validate fails after max retries, returns `{ escalate: true }` with structured failure details. Score and checklist passes are best-effort — they log warnings but don't block the process.
- **generate-tests.ts:** If workspace has no numbered stage folders, returns empty test cases array with a warning message. Never throws.
- **Escalation:** When `iterate.ts` returns `escalate: true`, SKILL.md instructs the agent to present the specific failures to the human with a proposed fix, rather than silently continuing.

### Testing Strategy

- **iterate.test.ts:**
  - Mock `validateWorkspace` to return failures → verify retry logic
  - Mock `validateWorkspace` to pass immediately → verify single pass, no retries
  - Mock `validateWorkspace` to always fail → verify escalation after max retries
  - Verify scoring function returns correct scores for known workspaces
  - Verify checklist function reports correct pass/fail

- **generate-tests.test.ts:**
  - Create workspace with 3 stages → verify 6-9 test cases generated (2-3 per stage)
  - Create workspace with no stages → verify empty test cases with warning
  - Verify test case structure (stage, type, input, expected)
  - Verify output file is valid JSON

- **Integration:**
  - Scaffold workspace → run iterate → verify score improves
  - Scaffold workspace → run generate-tests → verify valid JSON output

### Scope

**In Scope (This Phase):**
- `iterate.ts` with 3-pass loop (validate-fix, score, checklist)
- `generate-tests.ts` for test case generation
- Enhanced SKILL.md with autonomous iteration instructions
- Tests for both scripts
- Installer updated to copy new scripts

**Out of Scope (Future Phases):**
- Benchmark scoring system (Phase 4) — this is workspace quality scoring, not benchmark
- Multi-agent CLI flags (--claude, --copilot, --gemini) (Phase 4)
- External sub-agent API integration (sub-agents are spawned via agent's native tool use)
- Hill-climbing algorithm automation (Phase 3 was scoped as agent-driven, not script-driven)

### Success Criteria

1. `node scripts/iterate.ts` runs 3-pass loop and returns structured results
2. `node scripts/generate-tests.ts` generates test cases for all stages
3. Enhanced SKILL.md documents autonomous iteration workflow
4. Installer copies new scripts to skill directory
5. All tests pass (Phase 1 + Phase 2 + Phase 3)
6. Human escalation triggers correctly when validation fails after max retries

# Workspace-Maxxing Skill

## Role
You are a workspace architect. You create structured, ICM-compliant workspaces.

## Available Scripts

Use these scripts to programmatically build, validate, and equip workspaces. Invoke them via shell commands from the skill directory.

### scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

Options:
- `--name <name>` — Workspace name
- `--stages <s1,s2,...>` — Comma-separated stage folder names
- `--output <path>` — Where to create the workspace
- `--force` — Overwrite if output directory already exists

### validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

Checks:
- SYSTEM.md exists and contains a folder map
- CONTEXT.md exists at root level
- Every numbered folder has a CONTEXT.md
- No empty CONTEXT.md files
- No duplicate content across files

Exit code: 0 = all pass, 1 = some failed

### install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

Supported managers: `npm`, `pip`, `npx`, `brew`

### iterate.ts — Autonomous Iteration

Runs a 3-pass improvement loop: validate-fix → score → checklist.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

Output is JSON with pass results and an `escalate` flag.

### generate-tests.ts — Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

### benchmark.ts — Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node scripts/benchmark.ts --workspace ./workspace
```

**Weights:**
- `01-ideation`: 1.5x (core thinking quality)
- `02-research`: 1.3x (evidence gathering)
- `03-architecture`: 1.2x (structural decisions)
- All other stages: 1.0x

**Output:**
- Console: Formatted table with stage scores and suggestions
- JSON: Saved to `.workspace-benchmarks/<workspace>-<timestamp>.json`

The `iterate.ts` script includes benchmark data in its return value. Use the `improvementPotential` field to decide whether to continue iterating.

## Process

1. CAPTURE INTENT — Ask: "What workflow do you want to automate?"
2. PROPOSE STRUCTURE — Design workspace with numbered folders, CONTEXT.md routing files, canonical sources
3. GET APPROVAL — Present plan. Wait. Do not build until approved.
4. BUILD WORKSPACE — Run: `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace`
5. VALIDATE — Run: `node scripts/validate.ts --workspace ./workspace`. Fix any failures.
6. ASSESS TOOLS — Scan environment. List available tools. Propose missing tools needed. Get approval.
7. INSTALL TOOLS — For each approved tool: `node scripts/install-tool.ts --tool "<name>" --manager <mgr> --workspace ./workspace`
8. ITERATE — Run: `node scripts/iterate.ts --workspace ./workspace`. Follow the Autonomous Iteration workflow below.
9. FINAL VALIDATE — Run validate.ts one more time to confirm compliance.
10. DELIVER — Output: workspace folder + skill package + usage guide

## Autonomous Iteration

After scaffolding and initial validation, run the iteration loop:

### Step 1: Run iterate.ts

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

Read the JSON output. It has three passes:

**Pass 1 — Validate-Fix Loop:**
- If `status: "passed"` → move to Pass 2
- If `status: "escalated"` → read the `failures` array. Attempt to fix each failure manually, then re-run iterate.ts. If still failing after your fix attempt, escalate to human with the specific failures and your proposed fix.

**Pass 2 — Score-Driven Content Quality:**
- Read the `score` (0-100) and `improvements` array
- For each improvement item, update the relevant CONTEXT.md or SYSTEM.md file
- Re-run iterate.ts to see if the score improved
- Repeat until score plateaus (no improvement between runs) or score > 90

**Pass 3 — Completeness Checklist:**
- Read the `checklist` results showing items passed/failed
- For each failed item, fill in the missing content
- Re-run iterate.ts to confirm all items pass

### Step 2: Generate and Run Test Cases

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

Read the generated test cases. Then:

1. **Split test cases:** Divide them into two groups — half for generation, half for evaluation
2. **Generation sub-agents:** For each test case in the generation group, create sample content that the stage should produce. Document what good output looks like.
3. **Evaluation sub-agents:** For each test case in the evaluation group, review the workspace's current CONTEXT.md and determine if it would handle that test case correctly. Flag gaps.
4. **Aggregate results:** Combine findings from both groups. Identify patterns — are certain stages consistently weak? Are there structural issues?
5. **Fix identified gaps:** Update CONTEXT.md files, routing tables, or stage instructions to address findings.

### Step 3: Confidence Assessment

After iteration and testing, assess your confidence:

**High confidence (deliver):**
- All validation checks pass
- Score > 80
- All checklist items pass
- Test case evaluation shows no critical gaps

**Low confidence (escalate to human):**
Present to the human:
- Current score and checklist results
- Specific failures or gaps found
- What you attempted to fix
- Your proposed next steps

Wait for human guidance before proceeding.

## When to Use Scripts vs Manual

- **Scripts:** For structure creation, validation, tool installation, and iteration loops
- **Manual:** For writing content inside CONTEXT.md files, customizing stage descriptions, adding domain-specific instructions, fixing validation failures between retries

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions

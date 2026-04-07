# Autonomous Workflow & Sub-Skill Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform workspace-maxxing into a comprehensive autonomous workflow system with 7 sub-skills, shared references, and a dispatch script following obra/superpowers patterns.

**Architecture:** Main SKILL.md rewritten with YAML frontmatter and hybrid flow. 7 sub-skills in `templates/.workspace-templates/skills/`. 3 shared references in `templates/.workspace-templates/references/`. New `dispatch.ts` script for sub-skill invocation. Installer enhanced to copy new directories.

**Tech Stack:** TypeScript, Node.js builtins only (fs, path, process), Jest for testing.

---

### Task 1: Create Shared References

**Files:**
- Create: `templates/.workspace-templates/references/anti-patterns.md`
- Create: `templates/.workspace-templates/references/reporting-format.md`
- Create: `templates/.workspace-templates/references/iron-laws.md`
- Test: `tests/templates-enhanced.test.ts`

- [ ] **Step 1: Create anti-patterns.md**

```markdown
# Anti-Patterns & Rationalization Prevention

Common rationalizations agents use to skip steps, with reality checks.

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target > 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "This prompt update is cosmetic" | Prompt quality directly impacts agent behavior. No cosmetic-only changes. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |
| "The user will review anyway" | Autonomous means autonomous. Deliver quality without requiring human review. |
```

- [ ] **Step 2: Create reporting-format.md**

```markdown
# Sub-Skill Report Format

All sub-skills return a structured JSON report. Use this exact format.

## Report Structure

```json
{
  "skill": "<skill-name>",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601 timestamp>",
  "findings": [
    "<specific finding 1>",
    "<specific finding 2>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>"
  ],
  "metrics": {
    "<metric-name>": <value>,
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>
  },
  "nextSkill": "<next-skill-name>|none"
}
```

## Field Descriptions

- `skill`: Name of the sub-skill that generated this report
- `status`: One of "passed", "failed", or "escalated"
  - `passed`: All checks passed, no critical issues
  - `failed`: One or more checks failed, actionable items exist
  - `escalated`: Cannot proceed, requires human intervention
- `timestamp`: ISO-8601 timestamp of report generation
- `findings`: Array of specific observations (both positive and negative)
- `recommendations`: Array of actionable next steps
- `metrics`: Quantitative measurements from the sub-skill
  - `score`: 0-100 quality score
  - `itemsChecked`: Total items evaluated
  - `itemsPassed`: Items that passed evaluation
- `nextSkill`: Suggested next sub-skill to dispatch, or "none" if workflow is complete

## Usage

Print the report as JSON to stdout when the sub-skill completes:

```bash
echo '{"skill":"validation","status":"passed",...}'
```
```

- [ ] **Step 3: Create iron-laws.md**

```markdown
# Iron Laws

These rules are absolute. No exceptions. No rationalizations.

## The Iron Laws of Workspace Building

1. **NO BUILD WITHOUT PLAN** — Every workspace must have an approved architecture plan before scaffold.ts runs.

2. **NO PLAN WITHOUT RESEARCH** — Architecture decisions must be informed by pattern research and context gathering.

3. **NO IMPROVEMENT WITHOUT VALIDATION** — Never claim a workspace improved without running validate.ts before and after.

4. **NO COMPLETION CLAIM WITHOUT VERIFICATION** — Run the full test suite and validation checks before declaring delivery.

5. **NO SKIPPING PHASES** — The hybrid flow exists for a reason. Complete each phase before moving to the next.

6. **NO SILENT FAILURES** — If a sub-skill fails, report it. Do not continue as if nothing happened.

## Enforcement

Before any action, ask: "Which iron law does this touch?" If the answer is "none," you're probably about to break one.

Violation of any iron law requires immediate escalation to the human with:
- Which law was violated
- Why it was violated
- Proposed fix
```

- [ ] **Step 4: Write tests for references**

```typescript
// tests/templates-enhanced.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('Shared References', () => {
  const templatesDir = path.join(__dirname, '..', 'templates', '.workspace-templates');

  describe('references/ directory', () => {
    it('contains anti-patterns.md', () => {
      const filePath = path.join(templatesDir, 'references', 'anti-patterns.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Rationalization');
      expect(content).toContain('Thought');
      expect(content).toContain('Reality');
    });

    it('contains reporting-format.md', () => {
      const filePath = path.join(templatesDir, 'references', 'reporting-format.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('skill');
      expect(content).toContain('status');
      expect(content).toContain('findings');
      expect(content).toContain('recommendations');
      expect(content).toContain('nextSkill');
    });

    it('contains iron-laws.md', () => {
      const filePath = path.join(templatesDir, 'references', 'iron-laws.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('NO BUILD WITHOUT PLAN');
      expect(content).toContain('NO PLAN WITHOUT RESEARCH');
      expect(content).toContain('NO IMPROVEMENT WITHOUT VALIDATION');
      expect(content).toContain('NO COMPLETION CLAIM WITHOUT VERIFICATION');
    });
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test -- tests/templates-enhanced.test.ts`
Expected: FAIL with "ENOENT: no such file or directory"

- [ ] **Step 6: Create the references directory and files**

```bash
mkdir -p templates/.workspace-templates/references
```

Then write the three files from Steps 1-3.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts`
Expected: All 3 tests pass

- [ ] **Step 8: Commit**

```bash
git add templates/.workspace-templates/references/ tests/templates-enhanced.test.ts
git commit -m "feat: add shared references (anti-patterns, reporting-format, iron-laws)"
```

---

### Task 2: Create Validation Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/validation/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add validation sub-skill tests)

- [ ] **Step 1: Write test for validation sub-skill**

```typescript
// Add to tests/templates-enhanced.test.ts
describe('Sub-Skills', () => {
  const skillsDir = path.join(templatesDir, 'skills');

  describe('validation', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'validation', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---'); // YAML frontmatter
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });

    it('references validate.ts script', () => {
      const filePath = path.join(skillsDir, 'validation', 'SKILL.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('validate.ts');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "validation"`
Expected: FAIL with "ENOENT: no such file or directory"

- [ ] **Step 3: Create validation SKILL.md**

```markdown
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "validation"`
Expected: All validation tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/validation/ tests/templates-enhanced.test.ts
git commit -m "feat: add validation sub-skill"
```

---

### Task 3: Create Research Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/research/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add research sub-skill tests)

- [ ] **Step 1: Write test for research sub-skill**

```typescript
// Add to tests/templates-enhanced.test.ts
describe('research', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'research', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "research"`
Expected: FAIL

- [ ] **Step 3: Create research SKILL.md**

```markdown
---
name: research
description: "Investigates patterns, gathers context, and identifies best practices for workspace design. Use when starting a new workspace, researching workflow patterns, or before architecture planning."
---

## Overview

Gather context and identify patterns before building.

## When to Use

- Phase 1 of hybrid flow (always first)
- Before architecture planning
- When user asks for a novel workflow type
- When existing patterns don't fit the use case

## The Process

1. **Identify workflow type** — What kind of process is being automated?
2. **Research similar patterns** — Look at existing workspaces, documentation, best practices
3. **Identify key stages** — What are the natural phases of this workflow?
4. **Determine inputs/outputs** — What goes in, what comes out at each stage?
5. **Identify tooling needs** — What tools are commonly used for this workflow?
6. **Document findings** — Create a research summary for the architecture phase

## Red Flags

- Research is too generic (not specific to the workflow type)
- Missing input/output analysis
- No tooling assessment
- Skipping to architecture without completing research

## Report Format

```json
{
  "skill": "research",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>
  },
  "nextSkill": "architecture"
}
```

## Integration

- Always dispatches to architecture sub-skill next
- Research findings inform architecture decisions
- If research is inconclusive → escalate to human for clarification
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "research"`
Expected: All research tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/research/ tests/templates-enhanced.test.ts
git commit -m "feat: add research sub-skill"
```

---

### Task 4: Create Architecture Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/architecture/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add architecture sub-skill tests)

- [ ] **Step 1: Write test for architecture sub-skill**

```typescript
describe('architecture', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'architecture', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "architecture"`
Expected: FAIL

- [ ] **Step 3: Create architecture SKILL.md**

```markdown
---
name: architecture
description: "Designs workspace structure, plans folder layout, and creates the build plan. Use when planning workspace structure, designing folder hierarchy, or after research phase."
---

## Overview

Design the workspace structure based on research findings.

## When to Use

- Phase 2 of hybrid flow (after research)
- When research is complete and building is next
- When restructuring an existing workspace

## The Process

1. **Review research findings** — Read the research sub-skill report
2. **Define stage folders** — Determine numbered folder structure (01-xxx, 02-xxx, etc.)
3. **Design routing table** — Plan CONTEXT.md routing for each stage
4. **Define SYSTEM.md** — Plan folder map, rules, and tool inventory
5. **Plan CONTEXT.md content** — Define what each stage's CONTEXT.md should contain
6. **Create build plan** — Document the scaffold.ts command with all parameters
7. **Get approval** — Present plan to user before building

## Red Flags

- Stage folders don't follow sequential numbering
- Routing table doesn't reference all stages
- Missing SYSTEM.md plan
- Build plan doesn't specify all scaffold.ts parameters
- Skipping user approval before building

## Report Format

```json
{
  "skill": "architecture",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>
  },
  "nextSkill": "none"
}
```

## Integration

- Receives input from research sub-skill
- Output informs scaffold.ts execution
- After approval → main skill runs scaffold.ts
- If architecture is unclear → escalate to human
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "architecture"`
Expected: All architecture tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/architecture/ tests/templates-enhanced.test.ts
git commit -m "feat: add architecture sub-skill"
```

---

### Task 5: Create Prompt-Engineering Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/prompt-engineering/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add prompt-engineering sub-skill tests)

- [ ] **Step 1: Write test for prompt-engineering sub-skill**

```typescript
describe('prompt-engineering', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'prompt-engineering', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "prompt-engineering"`
Expected: FAIL

- [ ] **Step 3: Create prompt-engineering SKILL.md**

```markdown
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "prompt-engineering"`
Expected: All prompt-engineering tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/prompt-engineering/ tests/templates-enhanced.test.ts
git commit -m "feat: add prompt-engineering sub-skill"
```

---

### Task 6: Create Testing Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/testing/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add testing sub-skill tests)

- [ ] **Step 1: Write test for testing sub-skill**

```typescript
describe('testing', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'testing', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "testing"`
Expected: FAIL

- [ ] **Step 3: Create testing SKILL.md**

```markdown
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "testing"`
Expected: All testing tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/testing/ tests/templates-enhanced.test.ts
git commit -m "feat: add testing sub-skill"
```

---

### Task 7: Create Iteration Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/iteration/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add iteration sub-skill tests)

- [ ] **Step 1: Write test for iteration sub-skill**

```typescript
describe('iteration', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'iteration', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "iteration"`
Expected: FAIL

- [ ] **Step 3: Create iteration SKILL.md**

```markdown
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "iteration"`
Expected: All iteration tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/iteration/ tests/templates-enhanced.test.ts
git commit -m "feat: add iteration sub-skill"
```

---

### Task 8: Create Tooling Sub-Skill

**Files:**
- Create: `templates/.workspace-templates/skills/tooling/SKILL.md`
- Test: `tests/templates-enhanced.test.ts` (add tooling sub-skill tests)

- [ ] **Step 1: Write test for tooling sub-skill**

```typescript
describe('tooling', () => {
  it('has SKILL.md with required sections', () => {
    const filePath = path.join(skillsDir, 'tooling', 'SKILL.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Red Flags');
    expect(content).toContain('## Report Format');
    expect(content).toContain('## Integration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "tooling"`
Expected: FAIL

- [ ] **Step 3: Create tooling SKILL.md**

```markdown
---
name: tooling
description: "Assesses, installs, and configures tools for the workspace. Use when tools are missing, tool inventory needs updating, or workspace requires specific dependencies."
---

## Overview

Ensure workspace has the right tools installed and configured.

## When to Use

- Tool inventory is empty or incomplete
- Workspace requires specific dependencies
- After architecture phase identifies tooling needs
- When user requests specific tool installation

## The Process

1. **Scan current tools** — Read SYSTEM.md tool inventory
2. **Identify missing tools** — Compare against workspace requirements
3. **Propose tools** — List recommended tools with justifications
4. **Get approval** — Present tool list to user for approval
5. **Install tools** — Run `node scripts/install-tool.ts --tool <name> --manager <mgr> --workspace <path>`
6. **Update inventory** — Verify tool inventory is updated
7. **Verify installation** — Confirm tools are accessible

## Red Flags

- Installing tools without user approval
- Not updating tool inventory after installation
- Installing unnecessary tools
- Skipping verification after installation

## Report Format

```json
{
  "skill": "tooling",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>,
    "toolsInstalled": <number>,
    "toolsProposed": <number>
  },
  "nextSkill": "none"
}
```

## Integration

- Dispatched when tools are missing
- After installation → workflow continues to next phase
- If tool installation fails → escalate to human
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "tooling"`
Expected: All tooling tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/tooling/ tests/templates-enhanced.test.ts
git commit -m "feat: add tooling sub-skill"
```

---

### Task 9: Create Dispatch Script

**Files:**
- Create: `src/scripts/dispatch.ts`
- Test: `tests/dispatch.test.ts`

- [ ] **Step 1: Write tests for dispatch.ts**

```typescript
// tests/dispatch.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dispatchSkill, DispatchReport } from '../src/scripts/dispatch';

describe('dispatchSkill', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads and returns report for a valid sub-skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.skill).toBe('validation');
    expect(result.status).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('returns failed status for non-existent skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const result = dispatchSkill('nonexistent', skillsDir);

    expect(result.skill).toBe('nonexistent');
    expect(result.status).toBe('failed');
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('includes nextSkill recommendation in report', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.nextSkill).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/dispatch.test.ts`
Expected: FAIL with "Cannot find module '../src/scripts/dispatch'"

- [ ] **Step 3: Implement dispatch.ts**

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface DispatchReport {
  skill: string;
  status: 'passed' | 'failed' | 'escalated';
  timestamp: string;
  findings: string[];
  recommendations: string[];
  metrics: Record<string, number>;
  nextSkill: string;
}

const SKILL_NEXT_MAP: Record<string, string> = {
  research: 'architecture',
  architecture: 'none',
  validation: 'prompt-engineering',
  'prompt-engineering': 'testing',
  testing: 'iteration',
  iteration: 'none',
  tooling: 'none',
};

export function dispatchSkill(skillName: string, skillsDir: string): DispatchReport {
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return {
      skill: skillName,
      status: 'failed',
      timestamp: new Date().toISOString(),
      findings: [`Sub-skill SKILL.md not found: ${skillPath}`],
      recommendations: ['Ensure the sub-skill directory and SKILL.md exist'],
      metrics: {},
      nextSkill: 'none',
    };
  }

  const content = fs.readFileSync(skillPath, 'utf-8');

  // Parse frontmatter to extract name
  const nameMatch = content.match(/^---\nname:\s*(.+)$/m);
  const skill = nameMatch ? nameMatch[1].trim() : skillName;

  return {
    skill,
    status: 'passed',
    timestamp: new Date().toISOString(),
    findings: [`Sub-skill "${skill}" loaded successfully`],
    recommendations: ['Follow the sub-skill instructions to complete the task'],
    metrics: {
      contentLength: content.length,
    },
    nextSkill: SKILL_NEXT_MAP[skillName] ?? 'none',
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const skill = parseArg('--skill');
  const workspace = parseArg('--workspace');

  if (!skill) {
    console.error('Usage: node dispatch.ts --skill <name> --workspace <path>');
    process.exit(1);
  }

  const skillsDir = workspace
    ? path.join(workspace, '.agents', 'skills', 'workspace-maxxing', 'skills')
    : path.join(process.cwd(), 'skills');

  const result = dispatchSkill(skill, skillsDir);
  console.log(JSON.stringify(result, null, 2));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/dispatch.test.ts`
Expected: All 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scripts/dispatch.ts tests/dispatch.test.ts
git commit -m "feat: add dispatch script for sub-skill invocation"
```

---

### Task 10: Rewrite Main SKILL.md with obra patterns

**Files:**
- Modify: `templates/SKILL.md`
- Test: `tests/templates.test.ts` (update existing tests)

- [ ] **Step 1: Write test for rewritten SKILL.md**

```typescript
// Add to tests/templates.test.ts
describe('Main SKILL.md with obra patterns', () => {
  it('has YAML frontmatter with name and description', () => {
    const skillPath = path.join(__dirname, '..', 'templates', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---\nname:/m);
    expect(content).toMatch(/description:/);
  });

  it('has required sections', () => {
    const skillPath = path.join(__dirname, '..', 'templates', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## The Iron Law');
    expect(content).toContain('## Hybrid Flow');
    expect(content).toContain('## Sub-Skill Dispatch');
    expect(content).toContain('## Available Scripts');
    expect(content).toContain('## Anti-Rationalization Table');
    expect(content).toContain('## Integration');
  });

  it('references all 7 sub-skills', () => {
    const skillPath = path.join(__dirname, '..', 'templates', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('validation');
    expect(content).toContain('research');
    expect(content).toContain('prompt-engineering');
    expect(content).toContain('testing');
    expect(content).toContain('iteration');
    expect(content).toContain('architecture');
    expect(content).toContain('tooling');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/templates.test.ts -t "obra patterns"`
Expected: FAIL (sections don't exist yet)

- [ ] **Step 3: Rewrite SKILL.md**

```markdown
---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', or 'iterate on this workspace'."
---

# Workspace-Maxxing Skill

## Overview

Autonomous workflow system that creates, validates, and improves ICM-compliant workspaces through phased execution and condition-driven improvement loops.

## When to Use

- User asks to build, create, or automate a workflow
- User asks to improve, validate, or iterate on an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

## The Iron Law

NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO IMPROVEMENT WITHOUT VALIDATION
NO COMPLETION CLAIM WITHOUT VERIFICATION

## Hybrid Flow

```
Phase 1: RESEARCH (dispatch research sub-skill)
  ↓
Phase 2: ARCHITECTURE (dispatch architecture sub-skill)
  ↓
Phase 3: BUILD (use scaffold.ts script)
  ↓
Phase 4: VALIDATE (dispatch validation sub-skill)
  ↓
Condition Loop (repeat until score > 85 AND all validations pass):
  ├─ If validation failed → dispatch validation sub-skill
  ├─ If score < 80 → dispatch prompt-engineering sub-skill
  ├─ If no tests exist → dispatch testing sub-skill
  ├─ If score plateaued → dispatch iteration sub-skill
  └─ If tools missing → dispatch tooling sub-skill
  ↓
Phase 5: DELIVER
```

## Sub-Skill Dispatch

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Validation failed | `validation` | Re-run validation sub-skill |
| Score < 80 | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| No tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Score plateaued | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

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

### dispatch.ts — Sub-Skill Dispatcher

Loads and executes sub-skill workflows.

```bash
node scripts/dispatch.ts --skill <name> --workspace ./workspace
```

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target > 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## Integration

- Sub-skills live in `skills/` directory, loaded via dispatch.ts
- Shared references in `references/` directory (anti-patterns, reporting-format, iron-laws)
- All sub-skills return structured JSON reports
- Condition loop continues until score > 85 AND all validations pass
- Escalate to human if stuck after 3 iteration attempts

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates.test.ts`
Expected: All template tests pass (including new obra pattern tests)

- [ ] **Step 5: Commit**

```bash
git add templates/SKILL.md tests/templates.test.ts
git commit -m "feat: rewrite SKILL.md with obra patterns and sub-skill dispatch"
```

---

### Task 11: Enhance Installer for Sub-Skills

**Files:**
- Modify: `src/install.ts`
- Test: `tests/install.test.ts` (add sub-skill installation tests)

- [ ] **Step 1: Write tests for sub-skill installation**

```typescript
// Add to tests/install.test.ts
describe('sub-skill installation', () => {
  it('copies skills directory during install', async () => {
    const projectDir = path.join(tempDir, 'my-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const result = await installSkill(projectDir, templatesDir);

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'skills', 'validation', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'skills', 'research', 'SKILL.md'))).toBe(true);
  });

  it('copies references directory during install', async () => {
    const projectDir = path.join(tempDir, 'my-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const result = await installSkill(projectDir, templatesDir);

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'references', 'anti-patterns.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'workspace-maxxing', 'references', 'iron-laws.md'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/install.test.ts -t "sub-skill"`
Expected: FAIL (skills/references not copied yet)

- [ ] **Step 3: Verify installer already handles sub-skills**

The installer uses `copyDirSync` to copy the entire `.workspace-templates/` directory. Since `skills/` and `references/` are inside `.workspace-templates/`, they will be copied automatically. No code changes needed to `install.ts`.

Verify by checking that the directory structure exists:
```bash
ls templates/.workspace-templates/skills/
ls templates/.workspace-templates/references/
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/install.test.ts`
Expected: All install tests pass (including new sub-skill tests)

- [ ] **Step 5: Commit**

```bash
git add src/install.ts tests/install.test.ts
git commit -m "feat: verify installer copies sub-skills and references"
```

---

### Task 12: Copy Dispatch Script to Templates

**Files:**
- Create: `templates/.workspace-templates/scripts/dispatch.ts`
- Test: `tests/templates-enhanced.test.ts` (add dispatch script test)

- [ ] **Step 1: Write test for dispatch script in templates**

```typescript
// Add to tests/templates-enhanced.test.ts
describe('Dispatch Script', () => {
  it('exists in templates scripts directory', () => {
    const filePath = path.join(templatesDir, 'scripts', 'dispatch.ts');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('dispatchSkill');
    expect(content).toContain('DispatchReport');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/templates-enhanced.test.ts -t "Dispatch Script"`
Expected: FAIL

- [ ] **Step 3: Copy dispatch.ts to templates**

```bash
cp src/scripts/dispatch.ts templates/.workspace-templates/scripts/dispatch.ts
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates-enhanced.test.ts -t "Dispatch Script"`
Expected: All dispatch script tests pass

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/scripts/dispatch.ts tests/templates-enhanced.test.ts
git commit -m "feat: add dispatch script to templates"
```

---

### Task 13: Full Test Suite & Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (95 baseline + all new tests from Tasks 1-12)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Verify all sub-skills have required sections**

Run: `npm test -- tests/templates-enhanced.test.ts`
Expected: All sub-skill structure tests pass

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(sub-project-5): complete autonomous workflow & sub-skill framework"
```

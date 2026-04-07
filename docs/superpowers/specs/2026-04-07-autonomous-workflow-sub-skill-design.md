# Sub-Project 5: Autonomous Workflow & Sub-Skill Framework — Design Spec

## Overview

Transform workspace-maxxing from a single-skill tool into a comprehensive autonomous workflow system using obra/superpowers patterns. Add YAML frontmatter, trigger phrases, anti-rationalization tables, sub-skill dispatch, and a hybrid phase-driven → condition-driven flow.

## Architecture

### File Structure

```
templates/
├── SKILL.md                          # Main entry point (rewritten)
└── .workspace-templates/
    ├── skills/
    │   ├── validation/SKILL.md       # Workspace compliance checking
    │   ├── research/SKILL.md         # Pattern investigation & context gathering
    │   ├── prompt-engineering/SKILL.md # Prompt improvement & optimization
    │   ├── testing/SKILL.md          # Test generation & evaluation
    │   ├── iteration/SKILL.md        # Autonomous improvement loop
    │   ├── architecture/SKILL.md     # Workspace structure design
    │   └── tooling/SKILL.md          # Tool assessment & installation
    └── references/
        ├── anti-patterns.md          # Shared rationalization tables
        ├── reporting-format.md       # Standard sub-skill report structure
        └── iron-laws.md              # Shared discipline rules
```

### Main SKILL.md — Rewritten with obra patterns

**YAML Frontmatter:**
```yaml
---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', or 'iterate on this workspace'."
---
```

**Core Sections:**
- `## Overview` — Single-line core principle
- `## When to Use` — Decision tree (when/when not)
- `## The Iron Law` — Absolute gates (no build without plan, no plan without research)
- `## Hybrid Flow` — Phase-driven → condition-driven workflow diagram (DOT)
- `## Sub-Skill Dispatch` — Table mapping conditions to sub-skills
- `## Available Scripts` — Existing script documentation
- `## Anti-Rationalization Table` — Pre-empts agent shortcuts
- `## Integration` — How sub-skills connect

### Sub-Skills — Each follows obra SKILL.md pattern

Every sub-skill SKILL.md contains:
1. YAML frontmatter with name + description + trigger phrases
2. `## Overview` — What it does in one line
3. `## When to Use` — Decision criteria
4. `## The Process` — Step-by-step workflow
5. `## Red Flags` — What to watch for
6. `## Report Format` — Structured JSON output
7. `## Integration` — Which sub-skill to dispatch next

### Shared References

**anti-patterns.md:**
- Common rationalizations agents use to skip steps
- Reality checks for each rationalization
- Applies to all sub-skills

**reporting-format.md:**
- Standard JSON report structure all sub-skills return
- Fields: skill, status, findings, recommendations, nextSkill
- Ensures consistent handoff between sub-skills

**iron-laws.md:**
- NO BUILD WITHOUT PLAN
- NO PLAN WITHOUT RESEARCH
- NO IMPROVEMENT WITHOUT VALIDATION
- NO COMPLETION CLAIM WITHOUT VERIFICATION

### Hybrid Flow

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

### Sub-Skill Dispatch Script

New file: `src/scripts/dispatch.ts`

- Loads sub-skill SKILL.md from `skills/<name>/SKILL.md`
- Prints the sub-skill's full instructions to stdout for the agent to follow
- Accepts `--skill <name>` and `--workspace <path>` flags
- Returns the sub-skill's report as JSON when the agent completes its work
- Zero dependencies (Node.js builtins only)

**Usage:**
```bash
node scripts/dispatch.ts --skill validation --workspace ./workspace
```

The agent reads the dispatched instructions, executes the sub-skill's workflow, and writes the report JSON to stdout.

### Integration Points

- `install.ts` enhanced to copy `skills/` and `references/` directories during install
- `dispatch.ts` invoked by agents via shell command from skill directory
- Existing scripts (scaffold, validate, iterate, benchmark) remain unchanged
- Sub-skills reference existing scripts where applicable

## Testing Strategy

- `tests/dispatch.test.ts` — Sub-skill dispatch and report structure
- `tests/sub-skill-integration.test.ts` — End-to-end sub-skill workflow
- `tests/templates-enhanced.test.ts` — Verify all sub-skill SKILL.md files have required sections
- All existing tests must continue passing (95/95 baseline)

## Constraints

- Zero external dependencies (Node.js builtins only)
- Scripts invoked via shell commands, not as CLI flags on main package
- Sub-skills follow obra/superpowers SKILL.md format
- Main SKILL.md uses YAML frontmatter for trigger detection
- Progressive disclosure: sub-skill content only loaded when dispatched
- All sub-skills return structured JSON reports

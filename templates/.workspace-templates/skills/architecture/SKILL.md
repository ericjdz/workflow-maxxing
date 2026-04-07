---
name: architecture
description: "Designs workspace structure, plans folder layout, and creates the build plan. Use when planning workspace structure, designing folder hierarchy, or after research phase."
triggers: ["design workspace", "plan structure", "folder layout", "build plan"]
---

## Overview

Design the workspace structure based on research findings. Architecture translates research into a concrete, buildable plan.

## When to Use

- Phase 2 of the hybrid flow (after research)
- When research is complete and building is next
- When restructuring an existing workspace

## When Not to Use

- Before research is complete (use research sub-skill)
- During building itself (use scaffold.ts directly)
- For minor structural tweaks (use direct file operations)

## The Iron Law

NO ARCHITECTURE WITHOUT RESEARCH
NO BUILDING WITHOUT APPROVED PLAN
NO SKIPPING USER APPROVAL
NO AMBIGUOUS STAGE DEFINITIONS

## The Process

1. **Review research findings** - Read the research sub-skill report.
2. **Define stage folders** - Determine numbered folder structure (01-xxx, 02-xxx, and so on).
3. **Design routing table** - Plan CONTEXT.md routing for each stage.
4. **Define SYSTEM.md** - Plan the folder map, rules, and tool inventory.
5. **Plan CONTEXT.md content** - Define what each stage CONTEXT.md must contain.
6. **Create build plan** - Document the scaffold.ts command with all parameters.
7. **Get approval** - Present the plan to the user before building.

## Red Flags

- Stage folders do not follow sequential numbering
- Routing table does not reference all stages
- SYSTEM.md plan is missing or incomplete
- Build plan is missing scaffold.ts parameters
- User approval is skipped before build

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I will adjust the structure while building" | Structure changes mid-build are expensive. Plan first. |
| "This stage name is good enough" | Stage names affect routing. Be precise. |
| "The user will understand without approval" | Unapproved plans produce unwanted results. Always present the plan. |

## Sub-Skill Dispatch

- `status = passed` (plan approved) -> `nextSkill = none` and main workflow runs scaffold.ts.
- `status = failed` (plan incomplete or not approved) -> `nextSkill = none`.
- `status = escalated` (blocking uncertainty) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "architecture",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Defined four sequential stages with explicit routing"],
  "recommendations": ["Run scaffold.ts using the approved stage list"],
  "metrics": {
    "stagesPlanned": 4,
    "toolsIdentified": 2
  },
  "nextSkill": "none"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `none`.

## Integration

- Uses research output as architecture input.
- Produces the approved plan consumed by scaffold.ts.


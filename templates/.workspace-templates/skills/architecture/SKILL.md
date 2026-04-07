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

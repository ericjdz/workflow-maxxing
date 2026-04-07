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

---
name: research
description: "Investigates patterns, gathers context, and identifies best practices for workspace design. Use when starting a new workspace, researching workflow patterns, or before architecture planning."
triggers: ["research workflow", "gather context", "identify patterns", "best practices"]
---

## Overview

Gather context and identify patterns before building. Research ensures the workspace design is informed by real requirements, not assumptions.

## When to Use

- Phase 1 of the hybrid flow (always first)
- Before architecture planning
- When the user asks for a novel workflow type
- When existing patterns do not fit the use case

## When Not to Use

- After architecture is already planned (use architecture sub-skill)
- When workspace structure already exists (use validation sub-skill)
- For simple file creation (use direct file operations)

## The Iron Law

NO BUILD WITHOUT RESEARCH
NO GENERIC FINDINGS
NO SKIPPING INPUT/OUTPUT ANALYSIS
NO ASSUMPTIONS WITHOUT EVIDENCE

## The Process

1. **Identify workflow type** - Determine what process is being automated.
2. **Research similar patterns** - Review existing workspaces, docs, and best practices.
3. **Identify key stages** - Define the natural workflow phases.
4. **Determine inputs and outputs** - Capture what goes in and comes out at each stage.
5. **Identify tooling needs** - List tools commonly needed for this workflow.
6. **Document findings** - Create a concise research summary for architecture.

## Red Flags

- Research is too generic and not tied to the requested workflow
- Input and output analysis is missing
- Tooling assessment is missing
- Architecture starts before research findings are complete

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I already know this workflow type" | Knowledge is not research. Document findings for the next agent. |
| "Research is taking too long" | Research prevents wasted build time. Be thorough. |
| "I will figure it out while building" | Building without research produces generic, non-optimal workspaces. |
| "The user will clarify later" | Ask now. Ambiguous requirements produce ambiguous workspaces. |

## Sub-Skill Dispatch

- `status = passed` -> `nextSkill = architecture`.
- `status = failed` (research incomplete but recoverable) -> `nextSkill = none` and request missing inputs before rerun.
- `status = escalated` (blocking ambiguity or conflicting constraints) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "research",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Identified three reusable workflow stage patterns"],
  "recommendations": ["Use a three-stage layout with explicit input/output boundaries"],
  "metrics": {
    "patternsIdentified": 3,
    "stagesIdentified": 3
  },
  "nextSkill": "architecture"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `architecture`, `none`.

## Integration

- Feeds architecture with concrete findings and stage proposals.
- Reduces rework by grounding structure decisions in evidence.

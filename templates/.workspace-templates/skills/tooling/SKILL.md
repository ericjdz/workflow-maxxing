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

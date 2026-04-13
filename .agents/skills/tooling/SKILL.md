---
name: tooling
description: "Assesses, installs, and configures tools for the workspace. Use when tools are missing, tool inventory needs updating, or workspace requires specific dependencies."
triggers: ["install tools", "assess tooling", "update tool inventory", "configure dependencies"]
---

## Overview

Ensure workspace has the right tools installed and configured. Tooling manages the dependency layer of the workspace.

## When to Use

- Tool inventory is empty or incomplete
- Workspace requires specific dependencies
- Architecture identifies missing tooling needs
- User requests specific tool installation

## When Not to Use

- For non-tool structural changes (use architecture)
- For content quality improvements (use prompt-engineering)
- When no additional tools are needed

## The Iron Law

NO INSTALLING TOOLS WITHOUT USER APPROVAL
NO SKIPPING TOOL INVENTORY UPDATES
NO INSTALLING UNNECESSARY TOOLS
NO SKIPPING VERIFICATION AFTER INSTALLATION

## The Process

1. **Scan current tools** - Read SYSTEM.md tool inventory.
2. **Identify missing tools** - Compare requirements against installed tools.
3. **Propose tools** - Provide recommended tools with justification.
4. **Get approval** - Present the tool plan before installing.
5. **Install tools** - Run `node scripts/install-tool.ts --tool <name> --manager <mgr> --workspace <path>`.
6. **Update inventory** - Confirm SYSTEM.md or inventory section is updated.
7. **Verify installation** - Confirm each installed tool is accessible.

## Red Flags

- Tools installed without approval
- Inventory not updated after install
- Unnecessary tools installed
- Installation not verified

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This tool might be useful" | "Might" is not enough. Every tool needs explicit justification. |
| "I will install now and tell the user later" | Approval must come before installation. |
| "The install probably worked" | Probably is not verified. Validate each install. |

## Sub-Skill Dispatch

- `status = passed` (approved tooling installed and verified) -> `nextSkill = none`.
- `status = failed` (installation incomplete or verification failed) -> `nextSkill = none`.
- `status = escalated` (blocked by permissions, policy, or unresolved conflicts) -> `nextSkill = none`.

## Report Format

```json
{
  "skill": "tooling",
  "status": "passed",
  "timestamp": "2026-04-08T00:00:00Z",
  "findings": ["Installed two approved dependencies"],
  "recommendations": ["Run validation to confirm inventory consistency"],
  "metrics": {
    "toolsInstalled": 2,
    "toolsProposed": 2,
    "toolsFailed": 0
  },
  "nextSkill": "none"
}
```

Allowed `status` values: `passed`, `failed`, `escalated`.

Allowed `nextSkill` values: `none`.

## Integration

- Consumes architecture and requirement signals to propose tools.
- Produces verified dependency state for downstream validation.

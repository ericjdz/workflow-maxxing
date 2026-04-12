# Workspace-Maxxing with Invokable Agent Creation - Design Spec

## Overview

Extends `workspace-maxxing` skill to create, deliver, and iteratively improve an autonomous workflow agent inside the generated workspace. The skill builds both the ICM folder structure AND a self-improving agent that can be invoked with `@` in the workspace.

## Goals

1. Create invokable sub-agent inside the generated workspace
2. Agent implements the actual workflow use case (not just the workspace structure)
3. Self-improvement loop tests and strengthens the agent during build phase
4. Backward compatible with existing workspace-maxxing behavior
5. Multi-platform support (OpenCode, Claude Code, Copilot, Gemini)

## Non-Goals

1. Agent that persists outside the workspace (workspace-local only)
2. Real-time self-improvement after delivery (improvement only during build)
3. UI changes to workspace-maxxing skill

## Architecture

### Package Structure

```
workspace-maxxing/
├── SKILL.md                    # Main skill entry
├── package.json
├── src/
│   ├── index.ts                # Main entry, orchestration
│   ├── scaffold.ts              # Creates ICM workspace
│   ├── agent-creator.ts        # Creates @agent implementation
│   ├── agent-iterator.ts       # Self-improvement loop
│   └── installer.ts             # Platform-specific install
├── scripts/
│   ├── scaffold.ts              # (existing)
│   ├── validate.ts             # (existing)
│   ├── benchmark.ts            # (existing)
│   ├── dispatch.ts             # (existing)
│   └── orchestrator.ts         # (existing)
└── templates/
    ├── workspace/               # ICM workspace template
    └── agent/                   # Agent template base
```

### Agent Structure (Created Inside Workspace)

```
workspace/
├── .agents/
│   └── skills/
│       └── @<purpose>/         # The invokable agent
│           ├── SKILL.md
│           ├── prompts/
│           │   ├── system.md
│           │   └── tasks/
│           ├── tools/
│           │   └── index.ts
│           ├── tests/
│           │   └── cases.json
│           └── config.json
├── 01-input/
├── 02-process/
├── 03-output/
├── SYSTEM.md
└── CONTEXT.md
```

## Core Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ workspace-maxxing execution                                     │
├─────────────────────────────────────────────────────────────────┤
│ 1. Research phase (dispatch research sub-skill)               │
│ 2. Architecture phase (dispatch architecture sub-skill)       │
│ 3. Build workspace (scaffold.ts)                               │
│ 4. Create agent (agent-creator.ts)                            │
│    - Generate agent name from purpose                          │
│    - Create agent structure from template                      │
│    - Initialize prompts based on workflow                      │
│ 5. Iterate agent (agent-iterator.ts) - SELF-IMPROVING         │
│    a. Generate test cases (edge, empty, various)              │
│    b. Run agent with each test case                           │
│    c. Assess robustness (score + issues)                      │
│    d. If score < threshold: improve agent                     │
│    e. Repeat until score >= threshold OR max-retries         │
│ 6. Validate workspace (validate.ts)                           │
│ 7. Install agent to platform skill directory                   │
│ 8. Deliver                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Self-Improvement Loop

### Input

- Agent implementation (prompts, tools, config)
- Test case generation rules (edge cases, empty states, varied inputs)

### Process

1. **Generate test cases** - Create diverse test inputs based on workflow type
2. **Execute agent** - Run agent with each test case, capture outputs
3. **Assess robustness** - Check for:
   - Crashes or errors
   - Invalid outputs
   - Edge case handling
   - Empty input handling
4. **Score** - Compute robustness score (0-100)
5. **Improve** - If score < threshold, modify prompts/tools to fix issues
6. **Repeat** - Max 3 improvement cycles per batch

### Output

- Improved agent implementation
- Test case results with pass/fail per case
- Robustness score
- Iteration log

### Thresholds

- Default robustness threshold: 85
- Max iteration cycles: 3 per batch
- Batch size: 3 test cases

## Agent Naming

- **Pattern**: `@<purpose>` derived from workspace purpose
- **Generation**: Convert workspace name/purpose to lowercase, hyphenated
- **Examples**:
  - "Daily Digest" → `@daily-digest`
  - "Project Tracker" → `@project-tracker`
  - "AI News Aggregator" → `@ai-news-aggregator`

## Platform Integration

### OpenCode

- Location: `workspace/.agents/skills/@<name>/`
- Invocation: `@agent-name`
- Auto-load on first mention

### Claude Code

- Location: `workspace/.claude/skills/<name>/`
- Invocation: `{@name}` in prompts or instructions
- Manual first invocation required

### GitHub Copilot

- Location: `workspace/.github/copilot-instructions/<name>.md`
- Invocation: Through inline instructions

### Gemini CLI

- Location: `workspace/.gemini/skills/<name>/`
- Invocation: Follows Gemini instruction format

## Backward Compatibility

- **Default behavior**: Creates workspace + agent (new behavior)
- **Opt-out**: `--no-agent` flag creates workspace-only (existing behavior)
- **Detection**: If no agent flag specified, assumes with-agent
- **Existing scripts**: Unchanged, work as before
- **Existing workspaces**: No migration needed

## Configuration

### Workspace-Maxxing Options

| Option | Default | Description |
|--------|---------|-------------|
| `--with-agent` | true | Create invokable agent |
| `--agent-name` | auto | Custom agent name (overrides auto) |
| `--robustness-threshold` | 85 | Min score to pass iteration |
| `--max-agent-iterations` | 3 | Max improvement cycles |

### Agent Config

```json
{
  "name": "@daily-digest",
  "purpose": "Create daily AI news digest",
  "platforms": ["opencode", "claude", "copilot", "gemini"],
  "robustnessThreshold": 85,
  "iterationCount": 0,
  "testCases": []
}
```

## Anti-Patterns

| Thought | Reality |
|---------|---------|
| "The agent works for basic cases" | Edge cases and empty states matter. Iterate until threshold. |
| "One iteration is enough" | Self-improvement needs multiple cycles. |
| "User will refine the agent later" | Goal is robust agent on delivery. |
| "Agent validation is optional" | Robustness check is mandatory gate. |

## Acceptance Criteria

1. Workspace-maxxing creates both folder structure AND agent
2. Agent is invokable with `@<name>` in supported platforms
3. Self-improvement loop runs during build, achieves score >= 85
4. Backward compatible - existing usage unchanged with `--no-agent`
5. Agent persists in workspace, survives session restart
6. Iteration logs stored in workspace for debugging
7. Multi-platform installation works (OpenCode, Claude, Copilot, Gemini)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Agent name collision in workspace | Check existing agents, append number if needed |
| Platform detection fails | Default to OpenCode, log warning |
| Iteration infinite loop | Max 3 cycles, escalate after threshold not met |
| Agent template incomplete | Provide minimal viable template, improve over time |

## File Changes

### New Files

- `src/agent-creator.ts` - Creates agent implementation
- `src/agent-iterator.ts` - Self-improvement loop
- `templates/agent/` - Agent template base

### Modified Files

- `SKILL.md` - Update workflow to include agent creation
- `src/index.ts` - Add agent orchestration
- `package.json` - Add dependencies if needed

## Timeline

1. Phase 1: Agent creator (scaffold agent structure from template)
2. Phase 2: Agent iterator (self-improvement loop)
3. Phase 3: Platform installer (multi-platform support)
4. Phase 4: Backward compatibility (--no-agent flag)
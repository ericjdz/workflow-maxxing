---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces using batched parallel sub-agents. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', 'iterate on this workspace', 'run test cases', or 'create an agent'."
---

# Workspace-Maxxing Skill

## Overview

This is an **AI agent skill** that creates ICM-compliant workspaces with invokable agents. 

**User Flow:**
1. Install: `npx workspace-maxxing install` 
2. Invoke: `@workspace-maxxing` in your AI agent
3. Request: "Create a daily digest workspace" (or similar)
4. The skill builds: ICM workspace + invokable agent

## When to Use

- User asks to build, create, or automate a workflow
- User asks to improve, validate, or iterate on an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace
- User asks to run test cases against a workspace
- **User asks to create an agent for a specific task** (e.g., "create a daily digest agent", "make a news aggregator agent")

## User Commands (to the AI agent)

When you invoke `@workspace-maxxing`, you can ask:

| Request | What Happens |
|---------|-------------|
| "Build a workspace for X" | Creates ICM workspace with X workflow |
| "Create an agent for Y" | Creates invokable @agent for Y task |
| "Validate my workspace" | Checks ICM compliance |
| "Improve my workspace" | Runs autonomous iteration |
| "Add tools for Z" | Uses tooling sub-skill to install tools |

**IMPORTANT - Tool Discovery Before Agent Delivery:**

When creating ANY agent, ALWAYS do this FIRST:

1. **Check native tools** - What capabilities does the AI agent already have?
   - Playwright, puppeteer for browser automation?
   - Curl, wget for HTTP requests?
   - File system access?
   - Database connections?

2. **Verify tool accessibility** - Run a simple test to confirm tools work:
   ```
   Test: Can you make a simple HTTP request?
   Test: Can you list files in the current directory?
   Test: Can you execute a simple script?
   ```

3. **Install missing tools** - If native tools are insufficient:
   - Use `/skill tooling` to install MCP servers
   - Use `npm install` for CLI tools
   - Document installed tools in `00-meta/tools.md`

4. **Include tool instructions in agent prompts** - The created agent must know:
   - What tools are available
   - How to use them
   - Any rate limits or constraints

The skill will then execute the appropriate phases internally.

## Tool Discovery & Agent Harness

This skill is designed to **fully utilize its agent harness**. When running:

### 1. Tool Discovery

At the start of execution (especially during RESEARCH or ARCHITECTURE phases):
- Scan available tools in the workspace (check `00-meta/tools.md` or `tools/` directory)
- Look for MCP tools that could assist with the workflow
- Use the **tooling** sub-skill to assess and install needed tools: `/skill tooling --workspace ./workspace`
- Tools should be leveraged to enhance research, validation, and iteration

### 2. Sub-Skill Invocation

All sub-skills are invokable via **slash command** in your AI agent session:

| Command | Sub-Skill | Purpose |
|---------|-----------|---------|
| `/skill research` | `research` | Conduct research phase |
| `/skill architecture` | `architecture` | Design workspace architecture |
| `/skill validation` | `validation` | Validate workspace ICM compliance |
| `/skill iteration` | `iteration` | Run improvement iteration |
| `/skill testing` | `testing` | Generate and run tests |
| `/skill tooling` | `tooling` | Assess and install tools |
| `/skill prompt-engineering` | `prompt-engineering` | Improve prompt quality |
| `/skill worker` | `worker` | Execute worker task |
| `/skill fixer` | `fixer` | Fix failing test cases |

**To invoke a sub-skill**, use the dispatch script:
```bash
node skills/dispatch.ts --skill <sub-skill-name> --workspace ./workspace
```

Or if your agent supports slash commands:
```
/skill research --workspace ./workspace
```

### 3. Full Agent Harness Usage

This skill provides a complete agent development harness:

```
┌─────────────────────────────────────────────────────────────────┐
│ workspace-maxxing                                              │
├─────────────────────────────────────────────────────────────────┤
│  TOOLS: Look for available tools, install via tooling skill    │
│    ↓                                                            │
│  RESEARCH: Use /skill research to gather requirements         │
│    ↓                                                            │
│  ARCHITECTURE: Use /skill architecture to design structure    │
│    ↓                                                            │
│  BUILD: Use scaffold.ts to create workspace                   │
│    ↓                                                            │
│  VALIDATE: Use /skill validation to check ICM compliance     │
│    ↓                                                            │
│  ITERATE: Use /skill iteration for autonomous improvement     │
│    ↓                                                            │
│  TOOLING: Use /skill tooling to add more tools                 │
│    ↓                                                            │
│  DELIVER: Complete workspace with validated agents            │
└─────────────────────────────────────────────────────────────────┘
```

**Never skip sub-skills** - each one contributes to a robust workspace.

## Agent Creation Workflow

When you invoke `workspace-maxxing` with a request to create an agent (e.g., "create a lead scraping agent"), follow this flow:

```
1. Parse the request to extract the agent purpose (e.g., "Lead Scraper")
2. DISCOVER TOOLS:
   - Check what native tools are available in the AI agent (playwright, puppeteer, curl, etc.)
   - Verify tool accessibility by running a simple test
   - If native tools are insufficient, use tooling sub-skill to install MCPs or CLI tools
   - Document tools in 00-meta/tools.md
3. Create ICM workspace structure (SYSTEM.md, CONTEXT.md, stage folders)
4. Create invokable agent in .agents/skills/@<purpose>/
   - Include tool usage instructions in the agent prompts
5. Run self-improvement loop on the agent
   - Generate test cases (edge, empty, varied inputs)
   - Validate agent handling
   - Score robustness (0-100)
   - If score < 85: improve prompts, retry
   - Repeat until score >= 85 or max iterations (3)
6. Install agent for platform (OpenCode/Claude/Copilot/Gemini)
7. Deliver workspace with robust agent
```

### Agent Creation with Tool Discovery Example

User: "Create an agent that scrapes internet data for leads"

```
-> Extract purpose: "Lead Scraper"
-> DISCOVER TOOLS:
   - Check: Does agent have playwright? → Yes, test it works
   - Check: Does agent have curl/wget? → Yes, verify accessible
   - Check: Any MCP servers for scraping? → No, need to install
   - Action: Run tooling sub-skill to install puppeteer or similar
   - Verify: Test the tool with a simple request
-> Create workspace with stages: 01-input, 02-process, 03-output
-> Create agent: @lead-scraper with tool instructions in prompts
-> Run iteration:
   - Test: scraping a page -> works
   - Test: handling empty pages -> handles gracefully
   - Test: rate limiting -> respects limits
   - Score >= 85? Yes -> deliver
-> Agent is ready to invoke with @lead-scraper
```

**Tool Discovery is MANDATORY** - always check available tools, verify accessibility, and install missing tools before delivering the agent.

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

## The Iron Law

NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO TOOL DISCOVERY BEFORE AGENT DELIVERY
NO IMPROVEMENT WITHOUT VALIDATION
NO COMPLETION CLAIM WITHOUT VERIFICATION
NO PRODUCT IMPLEMENTATION INSIDE WORKSPACE BUILDING MODE
NO STAGE SKIPPING ACROSS NUMBERED WORKFLOW FOLDERS

## Scope Guardrails

- This skill builds an ICM workflow workspace, not the end-product application.
- Keep outputs as file-structured markdown workflow artifacts in numbered stage folders.
- Do not generate backend/frontend/runtime code for the target domain while running this skill.
- If a user asks for product implementation details, capture them as workflow requirements and continue building the workspace structure.

## Sequential Enforcement

- Follow numbered stage folders in strict order; do not jump ahead.
- Use 00-meta/execution-log.md as the source of truth for stage completion state.
- A later stage is blocked until the previous stage is checked complete with evidence notes.

## Hybrid Flow

```
Phase 1: RESEARCH (dispatch research sub-skill)
  ->
Phase 2: ARCHITECTURE (dispatch architecture sub-skill)
  ->
Phase 3: BUILD (use scaffold.ts script)
  ->
Phase 4: VALIDATE (dispatch validation sub-skill)
  ->
Phase 5: AUTONOMOUS ITERATION (use orchestrator.ts)
  - Generate test cases
  - Split into batches
  - Dispatch workers in parallel per batch
  - Validate batch results
  - If score < threshold and failing test cases exist -> dispatch fixer sub-agents -> re-validate
  - If score < threshold and no actionable failing test cases exist -> failed/escalated outcome
  - Next batch or complete
  ->
Phase 6: DELIVER
```

## Autonomous Iteration Workflow

The orchestrator manages batched parallel sub-agent execution:

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<your-runner-command>"
```

**Flow:**
1. Generate test cases from workspace stages
2. Split into batches (default 3 per batch)
3. Dispatch worker sub-agents in parallel for each batch (external runner mode)
4. Validate batch outputs with benchmark scoring
5. If batch score < threshold and failing test cases exist -> dispatch fixer sub-agents -> re-validate (max 3 retries)
6. If score remains < threshold and no actionable failing test cases exist -> mark batch failed/escalated
7. Move to next batch or write summary

**Options:**
- `--batch-size <n>` - Test cases per batch (default: 3)
- `--score-threshold <n>` - Minimum batch score to pass (default: 85)
- `--max-fix-retries <n>` - Max fix attempts per batch (default: 3)
- `--worker-timeout <s>` - Worker timeout in seconds (default: 300)
- `--subagent-runner <command>` - External command template used to execute worker/fixer sub-agents; supports placeholders `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`

## Sub-Agent Iteration Contract

- True sub-agent mode requires `--subagent-runner` (or `WORKSPACE_MAXXING_SUBAGENT_RUNNER`) so worker/fixer test cases execute outside the orchestrator process.
- Worker/fixer execution MUST fail fast when no runner command is configured.
- Batch artifacts must include generated test cases, per-test-case reports, and summary evidence under `.agents/iteration/`.

## Sub-Agent Runner Contract

- Worker/fixer loops are external-runner-only in strict mode.
- The runner command template must support placeholders: `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`.
- Expected runner output is JSON with `{skill, status, timestamp, findings, recommendations, metrics, nextSkill}`.
- Non-JSON runner output is treated as a runner contract failure for worker/fixer execution.
- Use telemetry artifacts under `.agents/iteration/runs/` to diagnose command/rendering or payload issues.

## Sub-Skill Dispatch

**All sub-skills are invokable via slash command in your AI agent session:**

| Command | Sub-Skill | Purpose |
|---------|-----------|---------|
| `/skill research` | `research` | Conduct research phase |
| `/skill architecture` | `architecture` | Design workspace architecture |
| `/skill validation` | `validation` | Validate workspace ICM compliance |
| `/skill iteration` | `iteration` | Run improvement iteration |
| `/skill testing` | `testing` | Generate and run tests |
| `/skill tooling` | `tooling` | Assess and install tools |
| `/skill prompt-engineering` | `prompt-engineering` | Improve prompt quality |
| `/skill worker` | `worker` | Execute worker task |
| `/skill fixer` | `fixer` | Fix failing test cases |

**To invoke a sub-skill**, use the dispatch script:
```bash
node skills/dispatch.ts --skill <sub-skill-name> --workspace ./workspace
```

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Running autonomous iteration | (use orchestrator.ts) | `node scripts/orchestrator.ts --workspace ./workspace --subagent-runner "<runner>"` |
| Worker execution | `worker` | `node scripts/dispatch.ts --skill worker --workspace ./workspace --batch-id <N> --runner-command "<runner {skill} {workspace} {batchId} {testCaseId}>"` |
| Fix loop | `fixer` | `node scripts/dispatch.ts --skill fixer --workspace ./workspace --batch-id <N> --runner-command "<runner {skill} {workspace} {batchId} {testCaseId}>"` |
| Manual condition loop only (not orchestrator batch loop): score < 85 due to prompt quality | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): no tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): score plateaued across full runs | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Manual condition loop only (not orchestrator batch loop): tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

### orchestrator.ts - Autonomous Batch Iteration

Runs the full batched parallel sub-agent workflow.

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<runner>"
```

### scaffold.ts - Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

### validate.ts - Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

### install-tool.ts - Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

### iterate.ts - Single-Workspace Iteration (legacy)

Runs a 3-pass improvement loop. Use orchestrator.ts for batched parallel iteration.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

### generate-tests.ts - Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

### benchmark.ts - Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node scripts/benchmark.ts --workspace ./workspace
```

### dispatch.ts - Sub-Skill Dispatcher

Loads and executes sub-skill workflows. Supports parallel dispatch.

```bash
node scripts/dispatch.ts --skill <name> --workspace ./workspace [--batch-id <N>] [--parallel --invocations <path>]
```

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target >= 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## Integration

- Sub-skills live in `skills/` directory, loaded via dispatch.ts
- Shared references in `references/` directory (anti-patterns, reporting-format, iron-laws)
- All sub-skills return structured JSON reports
- Orchestrator manages batch lifecycle with fix loops
- Condition loop continues until score >= 85 AND all validations pass
- Escalate to human if stuck after 3 iteration attempts

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A -> B, never B -> A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ - the built markdown-first workflow workspace
- .agents/skills/<workspace-name>/ - installable skill
- USAGE.md - how to use this workspace in future sessions
- .agents/iteration/summary.json - autonomous iteration results

## Creating Workspaces with Invokable Agents

The workspace-maxxing skill can now create both the workspace folder structure AND an invokable agent that can be called with `@` in the workspace.

### CLI Commands

```bash
# Create workspace WITH agent (default)
npx workspace-maxxing --create-workspace --workspace-name "Daily Digest" --stages "01-input,02-process,03-output"

# Create workspace WITHOUT agent (backward compatible)
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --no-agent

# Custom agent name
npx workspace-maxxing --create-workspace --workspace-name "AI News" --agent-name "@news-agent"

# Custom iteration settings
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --threshold 90 --max-iterations 5
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--create-workspace` | - | Enable workspace creation mode |
| `--workspace-name` | "My Workspace" | Name of the workspace |
| `--stages` | "01-input,02-process,03-output" | Comma-separated stage names |
| `--agent-name` | auto-generated (@workspace-name) | Custom agent name |
| `--no-agent` | false | Create workspace without agent |
| `--threshold` | 85 | Robustness threshold for agent iteration |
| `--max-iterations` | 3 | Max improvement cycles |

### What Gets Created

When you run with `--create-workspace`:

1. **ICM Workspace** - Folder structure with SYSTEM.md, CONTEXT.md, stage folders
2. **Invokable Agent** - Stored in `.agents/skills/@<name>/`
3. **Self-Improvement** - Agent runs through iteration loop until robustness >= threshold

### Agent Structure

```
workspace/
├── .agents/
│   └── skills/
│       └── @<name>/           # The invokable agent
│           ├── SKILL.md
│           ├── config.json
│           ├── prompts/
│           │   ├── system.md
│           │   └── tasks/
│           ├── tools/
│           └── tests/
├── 01-input/
├── 02-process/
├── 03-output/
├── SYSTEM.md
└── CONTEXT.md
```

### Invoking the Agent

After workspace is created, use `@` followed by the agent name:

- **OpenCode**: `@daily-digest`
- **Claude Code**: Via `.claude/skills/` directory
- **Copilot**: Via `.github/copilot-instructions/`
- **Gemini**: Via `.gemini/skills/` directory

### Agent Self-Improvement

When the agent is created, it runs through an iteration loop:

1. **Generate test cases** - Edge cases, empty states, varied inputs
2. **Validate** - Check agent handles each case properly
3. **Score** - Compute robustness score (0-100)
4. **Improve** - If score < threshold, update prompts to fix issues
5. **Repeat** - Until score >= threshold or max iterations reached

This ensures the delivered agent is robust for real-world use.

### Backward Compatibility

Existing workspace-maxxing behavior is unchanged:
- `--opencode`, `--claude`, `--copilot`, `--gemini` still install the skill
- Using `--no-agent` creates workspace-only (no agent)
- Default behavior (without `--no-agent`) includes agent creation

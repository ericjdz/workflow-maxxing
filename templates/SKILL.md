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
## IMPORTANT - Inline Workflow

Do NOT try to run dispatch scripts or external commands. Instead, follow the RESEARCH and ARCHITECTURE phases **inline** within your conversation:

### PHASE 1: RESEARCH ( Inline)

When you receive a workspace request (e.g., "I need a gym planning workspace"):

1. **Identify the workflow type**
   - What is being automated?
   - Example: "gym planning" = workout program creation and scheduling

2. **Analyze natural stages (DYNAMIC - not fixed to 3!)**
   - How many logical phases does this workflow have?
   - Simple workflow (2-3 phases): 01-input, 02-process
   - Medium workflow (3-4 phases): 01-input, 02-process, 03-output
   - Complex workflow (5+ phases): 01-discover, 02-validate, 03-enrich, 04-format, 05-export
   - Example for gym planning (3 stages):
     * 01-assess: Input goals, availability, equipment
     * 02-design: Create workout program
     * 03-schedule: Generate weekly schedule

3. **Discover installable tools (SEARCH REQUIRED!)**
   - Search for MCPs or CLI tools that can help this workflow
   - Use web search or GitHub search for: "MCP servers for [domain]" or "[domain] CLI tool"
   - Example searches:
     * "workout tracking MCP server"
     * "fitness API CLI tool"
     * "exercise database API"
   - Document found tools in research findings

4. **Determine inputs and outputs**
   - What data goes IN to each stage?
   - What markdown artifacts come OUT?

5. **Identify tooling needs**
   - What native tools does the AI already have?
   - What MCPs should be installed?
   - Document in 00-meta/tools.md

**DO THIS RESEARCH INLINE** - Think through these questions and document your findings. SEARCH for tools!

### PHASE 2: ARCHITECTURE (Inline)

After research, design the workspace structure:

1. **Define stage folders** based on your research
2. **Create SYSTEM.md** with folder map and rules
3. **Create CONTEXT.md** with routing table
4. **Create each stage's CONTEXT.md**

**DO THIS ARCHITECTURE INLINE** - Create the files directly. No scripts needed.

### PHASE 3: BUILD

Create the ICM workspace with the stages you determined.

### PHASE 4: VALIDATE

Check that the structure follows ICM rules.

### PHASE 5: DELIVER (MUST DO THIS!)

**EVERY workspace must have an invokable agent!** 

Create `.agents/skills/<agent-name>/` with these exact files:

#### 1. SKILL.md (exactly like this):
```markdown
---
name: @gym-planner
description: "Execute gym planning workflow. Use when user wants workout guidance."
triggers: ["@gym-planner", "gym planning", "workout help"]
---

# @gym-planner Agent

## Purpose
Gym planning and workout scheduling workflow

## When to Use
- User wants workout planning
- User needs weekly schedule
- User asks for exercise guidance

## Workflow Stages
- 01-assess → Gather user profile (goals, equipment, experience)
- 02-design → Create workout program  
- 03-schedule → Generate weekly schedule
```

#### 2. config.json:
```json
{
  "name": "@gym-planner",
  "purpose": "Gym planning and workout scheduling",
  "platforms": ["opencode", "claude", "copilot", "gemini"]
}
```

#### 3. prompts/system.md:
```markdown
# @gym-planner System Prompt

You are a gym planning assistant. Guide users through:
1. 01-assess - Collect profile (goals, days/week, equipment, experience)
2. 02-design - Match exercises to goals
3. 03-schedule - Generate weekly workout schedule
```

**Critical**: Create `.agents/skills/<name>/` with these files BEFORE delivering!

---

## Agent Creation Workflow

When you invoke `workspace-maxxing` with a request, follow this inline flow:

```
1. RESEARCH (inline)
   - Analyze the request
   - Determine stages
   - Identify inputs/outputs
   - Document findings

2. ARCHITECTURE (inline)
   - Design folder structure
   - Create SYSTEM.md, CONTEXT.md

3. BUILD
   - Create stage folders
   - Create CONTEXT.md files

4. VALIDATE
   - Check ICM compliance

5. DELIVER
   - Create @agent
   - Test if needed
```

**IMPORTANT - Stage Determination:**
- NEVER use "01-input, 02-process, 03-output" as default stages
- ANALYZE what the user actually needs
- Use stages that make sense for THAT specific workflow

### Inline Example

User: "I need a [any] workspace"

**RESEARCH (inline):**
- Workflow type: [What is being automated]
- Natural stages (determined by complexity):
  * Simple: 01-input, 02-output (2 stages)
  * Medium: 01-input, 02-process, 03-output (3 stages)
  * Complex: 01-collect, 02-validate, 03-enrich, 04-format, 05-export (5 stages)
- **Tool Discovery (SEARCH for installable tools):**
  * Search: "[domain] MCP server GitHub" or "[domain] CLI tool"
  * Document found tools in research findings
- Inputs: [What data enters the workflow]
- Outputs: [What artifacts are produced]

**ARCHITECTURE (inline):**
- Stage folders: Based on complexity (use 2-5 stages)
- Create SYSTEM.md, CONTEXT.md, stage CONTEXT.md files
- Include discovered tools in tool inventory

**BUILD:**
- Create folders and files

**DELIVER:**
- Create @[workflow-name] agent

That's it - no scripts to run!

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
| All requests | Use inline workflow | Follow RESEARCH → ARCHITECTURE → BUILD → VALIDATE → DELIVER inline |

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

**Note:** These scripts are optional. The preferred method is to follow the inline workflow (RESEARCH → ARCHITECTURE → BUILD → VALIDATE → DELIVER) directly in conversation.
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
npx workspace-maxxing --create-workspace --workspace-name "Daily Digest"

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

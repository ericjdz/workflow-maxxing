# workspace-maxxing

An installable skill package for AI coding agents that scaffolds, validates, and iterates on ICM-style workspaces with explicit workflow routing. Now with **invokable agent creation** - the skill can create autonomous agents that can be invoked with `@` in your workspace.

## Why This Exists

Most agent workspaces drift over time because prompts are underspecified and context loading is inconsistent. `workspace-maxxing` provides a repeatable workflow that generates structured `SYSTEM.md` and `CONTEXT.md` contracts, validates them, and improves them through autonomous iteration.

## Features

- Multi-agent install targets: OpenCode, Claude Code, GitHub Copilot, Gemini CLI
- ICM workspace scaffolding with robust root and per-stage context contracts
- Workflow-aware validation (routing coverage, stage dependency direction, selective loading)
- Batched autonomous iteration via orchestrator + worker/fixer loops
- Built-in test-case generation and weighted benchmarking
- **Create invokable agents** - the skill can build autonomous agents that can be invoked with `@` in your workspace
- **Self-improving agents** - created agents run through iteration loops to ensure robustness

## Requirements

- Node.js 18+
- `npx` available in your shell

## Install

```bash
# OpenCode (default target)
npx workspace-maxxing --opencode

# Claude Code
npx workspace-maxxing --claude

# GitHub Copilot
npx workspace-maxxing --copilot

# Gemini CLI
npx workspace-maxxing --gemini
```

### Install Targets

| Target | Flag | Install Path |
|---|---|---|
| OpenCode | `--opencode` | `.agents/skills/workspace-maxxing/` |
| Claude Code | `--claude` | `.claude/skills/` |
| GitHub Copilot | `--copilot` | `.github/copilot-instructions/` |
| Gemini CLI | `--gemini` | `.gemini/skills/` |

## Quick Start

### Option 1: Install the Skill

1. Install to your preferred target with `npx workspace-maxxing --<target>`.
2. Open a new agent session.
3. Invoke the `workspace-maxxing` skill.
4. Approve the proposed workflow structure.
5. Let the agent scaffold, validate, and iterate until quality gates pass.

### Option 2: Create a Workspace with Agent

```bash
# Create workspace with invokable agent (default)
npx workspace-maxxing --create-workspace --workspace-name "Daily Digest" --stages "01-input,02-process,03-output"

# Create workspace without agent (backward compatible)
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --no-agent

# Custom agent name
npx workspace-maxxing --create-workspace --workspace-name "AI News" --agent-name "@news-agent"

# Custom iteration settings
npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --threshold 90 --max-iterations 5
```

### CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--create-workspace` | - | Enable workspace creation mode |
| `--workspace-name` | "My Workspace" | Name of the workspace |
| `--stages` | "01-input,02-process,03-output" | Comma-separated stage names |
| `--output` | "./workspace" | Output directory |
| `--agent-name` | auto-generated (@workspace-name) | Custom agent name |
| `--no-agent` | false | Create workspace without agent |
| `--threshold` | 85 | Robustness threshold for agent iteration |
| `--max-iterations` | 3 | Max improvement cycles |

## What Gets Installed

- `SKILL.md` (entry behavior and phase logic)
- `.workspace-templates/` (SYSTEM/CONTEXT templates and scripts)
- `scripts/` (scaffold, validate, dispatch, orchestrator, benchmark, etc.)

## Agent Creation Workflow

When you invoke `workspace-maxxing` with a request to create an agent (e.g., "create a daily digest agent"):

1. **Parse the request** - Extract the agent purpose (e.g., "Daily Digest")
2. **Create ICM workspace** - SYSTEM.md, CONTEXT.md, stage folders
3. **Create invokable agent** - In `.agents/skills/@<purpose>/`
4. **Run self-improvement loop**:
   - Generate test cases (edge, empty, varied inputs)
   - Validate agent handling
   - Score robustness (0-100)
   - If score < 85: improve prompts, retry
   - Repeat until score >= 85 or max iterations (3)
5. **Install agent** for platform (OpenCode/Claude/Copilot/Gemini)
6. **Deliver** workspace with robust agent

### Invoking the Created Agent

After workspace is created, use `@` followed by the agent name:

- **OpenCode**: `@daily-digest`
- **Claude Code**: Via `.claude/skills/` directory
- **Copilot**: Via `.github/copilot-instructions/`
- **Gemini**: Via `.gemini/skills/` directory

## Workflow Model

The skill follows a phased flow:

1. Research
2. Architecture
3. Build (scaffold workspace)
4. Validate
5. Autonomous iteration (batched worker/fixer loops)
6. Deliver

This is designed to keep prompt structure, execution order, and handoffs explicit.

## Sub-Agent Runner Contract

Worker/fixer execution is external-runner-driven in strict mode. Configure orchestrator with `--subagent-runner` (or `WORKSPACE_MAXXING_SUBAGENT_RUNNER`) using placeholders:

```bash
node scripts/orchestrator.ts --workspace ./workspace --subagent-runner "<runner-command> {skill} {workspace} {batchId} {testCaseId}"
```

Contract details:

- `worker/fixer` require an external runner command.
- Runner output must be JSON containing: `skill`, `status`, `timestamp`, `findings`, `recommendations`, `metrics`, `nextSkill`.
- Missing/invalid payloads are treated as failures (no simulated completion).
- Telemetry is written under `.agents/iteration/runs/` for troubleshooting.

## Included Script Surface

Run these from the installed skill directory (for example, `.agents/skills/workspace-maxxing/` in OpenCode).

| Script | Purpose | Example |
|---|---|---|
| `scaffold.ts` | Create an ICM workspace from a stage plan | `node scripts/scaffold.ts --name "my-flow" --stages "01-input,02-process,03-output" --output ./workspace` |
| `validate.ts` | Validate workspace structure and routing rules | `node scripts/validate.ts --workspace ./workspace` |
| `generate-tests.ts` | Generate stage-based test cases | `node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json` |
| `dispatch.ts` | Dispatch sub-skills (single or parallel) | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| `orchestrator.ts` | Run batched autonomous iteration | `node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<runner>"` |
| `benchmark.ts` | Compute weighted benchmark score | `node scripts/benchmark.ts --workspace ./workspace` |
| `install-tool.ts` | Install a tool and update inventory | `node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace` |
| `iterate.ts` | Legacy single-loop iteration path | `node scripts/iterate.ts --workspace ./workspace --max-retries 3` |

## ICM Layers

Based on the Interpretable Context Methodology (ICM):

- Layer 0: `SYSTEM.md` (global rules)
- Layer 1: root `CONTEXT.md` (routing)
- Layer 2: stage `CONTEXT.md` files (contracts)
- Layer 3: selective task artifacts

Reference: [Interpretable Context Methodology paper](https://arxiv.org/abs/2603.16021)

## Local Development

```bash
npm install
npm run build
npm test
```

## Project Layout

```
workspace-maxxing/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── install.ts        # Skill installation
│   ├── agent-creator.ts  # Agent creation
│   ├── agent-iterator.ts # Agent self-improvement
│   ├── platforms/        # Platform installers
│   └── scripts/          # Core scripts
├── templates/
│   ├── SKILL.md         # Main skill definition
│   └── .workspace-templates/  # Workspace templates
└── tests/
```

## Contributing

1. Fork and create a feature branch.
2. Add or update tests for behavior changes.
3. Run `npm run build` and `npm test`.
4. Open a PR with context on workflow impact.

## License

MIT License - see [LICENSE](LICENSE) file for details.

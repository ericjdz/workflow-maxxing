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

## Quick Start

### One Command Does Everything

```bash
# Create workspace with agent (recommended)
npx workspace-maxxing init

# Install skill to OpenCode
npx workspace-maxxing install

# Or use the old way (still works)
npx workspace-maxxing --opencode
```

That's it! No extra flags needed.

## Two Main Use Cases

### Use Case 1: Create a New Workspace with Agent

When you want to start a new workflow project:

```bash
# Basic (creates "My Workspace" with 3 stages)
npx workspace-maxxing init

# Custom name
npx workspace-maxxing init --workspace-name "Daily Digest"

# Custom stages
npx workspace-maxxing init --stages "01-input,02-process,03-output,04-deploy"

# Without agent (backward compatible)
npx workspace-maxxing init --no-agent

# To specific folder
npx workspace-maxxing init --output "./my-workspace"
```

This creates:
- ICM workspace folder structure
- Invokable `@agent` in `.agents/skills/`
- Runs self-improvement loop (score >= 85)

### Use Case 2: Install the Skill to Your Project

When you want to use workspace-maxxing as a skill in your AI agent:

```bash
# Install to current project (OpenCode)
npx workspace-maxxing install

# Install to specific platform
npx workspace-maxxing --opencode
npx workspace-maxxing --claude
npx workspace-maxxing --copilot
npx workspace-maxxing --gemini
```

This installs the skill to `.agents/skills/workspace-maxxing/` so you can invoke it in your AI agent session with `@workspace-maxxing`.

## CLI Options

| Option | Description |
|--------|-------------|
| `init` | Create workspace with agent (default command) |
| `install` | Install skill to current project |
| `--workspace-name` | Name of the workspace |
| `--stages` | Comma-separated stages |
| `--output` | Output directory |
| `--no-agent` | Create workspace without agent |
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

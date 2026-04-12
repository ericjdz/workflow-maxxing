# workspace-maxxing

An AI agent skill that builds ICM-compliant workspaces with invokable agents. The skill runs **inside your AI agent** and creates workspaces + agents on demand.

## The Flow

```
1. Install: npx workspace-maxxing install
2. Invoke in AI: @workspace-maxxing
3. Ask: "Create a daily digest workspace"
4. Skill builds: workspace + @daily-digest agent
```

## Quick Start

```bash
# Step 1: Install the skill to your project
npx workspace-maxxing install

# Step 2: In your AI agent, invoke the skill
@workspace-maxxing

# Step 3: Ask it to create something
"Create a workspace for my daily news aggregator"
```

The skill will then:
- Research your request
- Design the workspace architecture
- Build the ICM folder structure
- Create an invokable agent inside
- Run self-improvement on the agent
- Deliver the complete workspace

## What Gets Created

When you ask `@workspace-maxxing` to create a workspace for "Daily Digest":

```
my-workspace/
├── .agents/skills/daily-digest/  ← Invokable with @daily-digest
│   ├── SKILL.md
│   └── prompts/
├── 01-input/
├── 02-process/
├── 03-output/
├── SYSTEM.md
└── CONTEXT.md
```

Now you can use `@daily-digest` to run that workflow!

## Tool Discovery (Automatic)

When you ask `@workspace-maxxing` to create an agent (e.g., "lead scraper"), it **automatically**:

1. **Checks available tools** - What does the AI agent already have?
2. **Verifies accessibility** - Runs a test to confirm tools work
3. **Installs missing tools** - Uses tooling sub-skill if needed
4. **Includes in agent** - Tool instructions in the created agent's prompts

Example for "lead scraper":
```
→ Check: playwright available? test it
→ Check: curl available? verify
→ Missing: puppeteer MCP → install it
→ Test: can we scrape a page? → yes
→ Create @lead-scraper with tool instructions
→ Deliver
```

## Commands

| Command | What It Does |
|---------|-------------|
| `npx workspace-maxxing install` | Install skill to current project |
| `@workspace-maxxing` | Invoke in your AI agent |
| `npx workspace-maxxing --opencode` | Install for specific platform |
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

# workspace-maxxing

> npx-installable skill for AI agents to create structured workspaces using the Interpretable Context Methodology (ICM).

## Quick Start

```bash
# Install for OpenCode (default)
npx workspace-maxxing --opencode

# Install for Claude Code
npx workspace-maxxing --claude

# Install for GitHub Copilot
npx workspace-maxxing --copilot

# Install for Gemini CLI
npx workspace-maxxing --gemini
```

This installs the workspace-maxxing skill into your project's agent-specific skills directory.

## What It Does

After installation, open a new session and invoke the workspace-maxxing skill. The agent will:

1. Ask what workflow you want to automate
2. Propose a workspace structure using ICM methodology
3. Wait for your approval
4. Build the workspace with numbered folders, routing tables, and reference files
5. Assess available tools and propose any missing ones
6. Run autonomous iteration to improve workspace quality
7. Deliver a complete workspace + skill package + usage guide

## Available Scripts

| Script | Description |
|--------|-------------|
| `scaffold.ts` | Generate ICM workspace from a plan |
| `validate.ts` | Check ICM compliance |
| `install-tool.ts` | Install packages and update inventory |
| `iterate.ts` | Autonomous 3-pass improvement loop |
| `generate-tests.ts` | Generate test cases per stage |
| `benchmark.ts` | Weighted benchmark scoring |

### Benchmark Scoring

The benchmark script scores workspaces with weighted stages:

- `01-ideation`: 1.5x (core thinking quality)
- `02-research`: 1.3x (evidence gathering)
- `03-architecture`: 1.2x (structural decisions)
- All other stages: 1.0x

Run benchmarks:
```bash
node .agents/skills/workspace-maxxing/scripts/benchmark.ts --workspace ./workspace
```

Results include weighted scores, fix suggestions, and improvement potential.

## ICM Methodology

Based on [Interpretable Context Methodology](https://arxiv.org/abs/2603.16021) by Jake Van Clief & David McDermott:

- **Layer 0** — SYSTEM.md: always-loaded system prompt
- **Layer 1** — CONTEXT.md: task-to-workspace routing
- **Layer 2** — Per-folder CONTEXT.md: stage-specific instructions
- **Layer 3** — Content files: selectively loaded reference material

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT

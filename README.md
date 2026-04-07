# workspace-maxxing

An installable skill package for AI coding agents that scaffolds, validates, and iterates on ICM-style workspaces with explicit workflow routing.

## Why This Exists

Most agent workspaces drift over time because prompts are underspecified and context loading is inconsistent. `workspace-maxxing` provides a repeatable workflow that generates structured `SYSTEM.md` and `CONTEXT.md` contracts, validates them, and improves them through autonomous iteration.

## Features

- Multi-agent install targets: OpenCode, Claude Code, GitHub Copilot, Gemini CLI
- ICM workspace scaffolding with robust root and per-stage context contracts
- Workflow-aware validation (routing coverage, stage dependency direction, selective loading)
- Batched autonomous iteration via orchestrator + worker/fixer loops
- Built-in test-case generation and weighted benchmarking

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

1. Install to your preferred target with `npx workspace-maxxing --<target>`.
2. Open a new agent session.
3. Invoke the `workspace-maxxing` skill.
4. Approve the proposed workflow structure.
5. Let the agent scaffold, validate, and iterate until quality gates pass.

## What Gets Installed

- `SKILL.md` (entry behavior and phase logic)
- `.workspace-templates/` (SYSTEM/CONTEXT templates and scripts)
- `scripts/` (scaffold, validate, dispatch, orchestrator, benchmark, etc.)

## Workflow Model

The skill follows a phased flow:

1. Research
2. Architecture
3. Build (scaffold workspace)
4. Validate
5. Autonomous iteration (batched worker/fixer loops)
6. Deliver

This is designed to keep prompt structure, execution order, and handoffs explicit.

## Included Script Surface

Run these from the installed skill directory (for example, `.agents/skills/workspace-maxxing/` in OpenCode).

| Script | Purpose | Example |
|---|---|---|
| `scaffold.ts` | Create an ICM workspace from a stage plan | `node scripts/scaffold.ts --name "my-flow" --stages "01-input,02-process,03-output" --output ./workspace` |
| `validate.ts` | Validate workspace structure and routing rules | `node scripts/validate.ts --workspace ./workspace` |
| `generate-tests.ts` | Generate stage-based test cases | `node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json` |
| `dispatch.ts` | Dispatch sub-skills (single or parallel) | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| `orchestrator.ts` | Run batched autonomous iteration | `node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85` |
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

```text
src/
	index.ts
	install.ts
	scripts/
templates/
	SKILL.md
tests/
```

## Contributing

1. Fork and create a feature branch.
2. Add or update tests for behavior changes.
3. Run `npm run build` and `npm test`.
4. Open a PR with context on workflow impact.

## License

MIT

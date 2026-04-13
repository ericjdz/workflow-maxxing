# Scripts Reference (CLI Development Only)

These scripts are used by the `npx workspace-maxxing init` CLI command internally. They are NOT for use by AI agents reading the skill — agents should follow the inline workflow described in SKILL.md.

## scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace folder structure.

```bash
node dist/scripts/scaffold.js --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

## validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node dist/scripts/validate.js --workspace ./workspace
```

## benchmark.ts — Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node dist/scripts/benchmark.js --workspace ./workspace
```

## iterate.ts — Single-Workspace Iteration

Runs a 3-pass improvement loop.

```bash
node dist/scripts/iterate.js --workspace ./workspace --max-retries 3
```

## generate-tests.ts — Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node dist/scripts/generate-tests.js --workspace ./workspace --output ./tests.json
```

## install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node dist/scripts/install-tool.js --tool "pdf-lib" --manager npm --workspace ./workspace
```

## orchestrator.ts — Autonomous Batch Iteration

Runs the full batched parallel sub-agent workflow.

```bash
node dist/scripts/orchestrator.js --workspace ./workspace --batch-size 3 --score-threshold 85 --subagent-runner "<runner>"
```

**Options:**
- `--batch-size <n>` — Test cases per batch (default: 3)
- `--score-threshold <n>` — Minimum batch score to pass (default: 85)
- `--max-fix-retries <n>` — Max fix attempts per batch (default: 3)
- `--worker-timeout <s>` — Worker timeout in seconds (default: 300)
- `--subagent-runner <command>` — External command template; supports placeholders `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`

## dispatch.ts — Sub-Skill Dispatcher

Loads and executes sub-skill workflows.

```bash
node dist/scripts/dispatch.js --skill <name> --workspace ./workspace [--batch-id <N>] [--parallel --invocations <path>]
```

## Sub-Agent Runner Contract

- Worker/fixer execution requires `--subagent-runner` or `WORKSPACE_MAXXING_SUBAGENT_RUNNER` env var.
- Runner command template must support placeholders: `{skill}`, `{workspace}`, `{batchId}`, `{testCaseId}`.
- Expected runner output is JSON with `{skill, status, timestamp, findings, recommendations, metrics, nextSkill}`.
- Non-JSON runner output is treated as a runner contract failure.

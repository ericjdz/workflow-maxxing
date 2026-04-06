# workspace-maxxing

> npx-installable skill for AI agents to create structured workspaces using the Interpretable Context Methodology (ICM).

## Quick Start

```bash
npx workspace-maxxing --opencode
```

This installs the workspace-maxxing skill into `.agents/skills/workspace-maxxing/` in your project.

## What It Does

After installation, open a new OpenCode session and invoke the workspace-maxxing skill. The agent will:

1. Ask what workflow you want to automate
2. Propose a workspace structure using ICM methodology
3. Wait for your approval
4. Build the workspace with numbered folders, routing tables, and reference files
5. Assess available tools and propose any missing ones
6. Test the workspace autonomously with sub-agents
7. Deliver a complete workspace + skill package + usage guide

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

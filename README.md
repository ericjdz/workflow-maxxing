# workspace-maxxing

<p align="center">
  <a href="https://www.npmjs.com/package/workspace-maxxing">
    <img src="https://img.shields.io/npm/v/workspace-maxxing?style=flat&color=blue" alt="npm version">
  </a>
  <a href="https://github.com/ericjdz/workflow-maxxing/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/workspace-maxxing?style=flat&color=green" alt="MIT License">
  </a>
  <a href="https://github.com/ericjdz/workflow-maxxing">
    <img src="https://img.shields.io/github/stars/ericjdz/workflow-maxxing?style=flat" alt="GitHub stars">
  </a>
</p>

> An AI agent skill that builds ICM-compliant workspaces with invokable sub-agents. One command, complete workflow automation.

## Why workspace-maxxing?

Most AI agent workspaces are disorganized—context is scattered, prompts are vague, and workflows lack structure. **workspace-maxxing** solves this by:

- **Creating structured workspaces** with ICM methodology (SYSTEM.md, CONTEXT.md, stage folders)
- **Building autonomous agents** that you can invoke with `@agent-name`
- **Self-improving agents** that validate and iterate until robust
- **Automatic tool discovery** - checks available tools, installs missing ones

## Quick Start

```bash
# 1. Install the skill to your project
npx workspace-maxxing install

# 2. In your AI agent, invoke the skill
@workspace-maxxing

# 3. Ask it to create something
"Create a workspace for lead scraping"
```

The skill does everything else—creates folder structure, builds the agent, verifies tools, runs self-improvement.

## What You Get

When you ask for a "lead scraping" workspace:

```
lead-scraper/
├── .agents/skills/lead-scraper/   ← Invokable with @lead-scraper
│   ├── SKILL.md
│   ├── prompts/
│   └── config.json
├── 01-input/                     ← Stage 1: Input
├── 02-process/                    ← Stage 2: Processing  
├── 03-output/                    ← Stage 3: Output
├── 00-meta/                      ← Metadata & tools
├── SYSTEM.md                     ← Global rules
└── CONTEXT.md                    ← Routing
```

Now use `@lead-scraper` to run that workflow anytime.

## Features

### 🎯 Agent Creation
- Create invokable agents for any workflow
- Agents self-improve until score ≥ 85
- Built-in test case generation & validation

### 🔧 Automatic Tool Discovery
- Checks what native tools your AI agent has
- Verifies tool accessibility with test runs
- Installs missing MCPs or CLI tools automatically

### 📁 ICM Workspace Structure
- SYSTEM.md (global rules)
- CONTEXT.md (routing)
- Numbered stage folders (01-input, 02-process, 03-output)
- 00-meta for tools & execution logs

### 🔄 Multi-Platform Support

| Platform | Installation |
|----------|--------------|
| OpenCode | `npx workspace-maxxing install` |
| Claude Code | `npx workspace-maxxing --claude` |
| GitHub Copilot | `npx workspace-maxxing --copilot` |
| Gemini CLI | `npx workspace-maxxing --gemini` |

## Commands

### CLI Commands

```bash
# Install the skill
npx workspace-maxxing install

# Install for specific platform
npx workspace-maxxing --opencode

# Legacy commands (still work)
npx workspace-maxxing init
npx workspace-maxxing --create-workspace --workspace-name "My Project"
```

### In Your AI Agent

When you invoke `@workspace-maxxing`, you can ask:

| Request | Action |
|---------|--------|
| `"Build a workspace for X"` | Creates ICM workspace |
| `"Create an agent for Y"` | Creates invokable @agent |
| `"Validate my workspace"` | Checks ICM compliance |
| `"Improve my workspace"` | Runs autonomous iteration |
| `"Add tools for Z"` | Installs required tools |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ @workspace-maxxing (invoked by user)                │
├─────────────────────────────────────────────────────┤
│ 1. RESEARCH     → Analyze the request            │
│ 2. TOOLING      → Discover & install tools       │
│ 3. ARCHITECTURE → Design workspace structure      │
│ 4. BUILD        → Create ICM folders & files      │
│ 5. AGENT        → Build invokable @agent          │
│ 6. ITERATE      → Self-improve until robust       │
│ 7. DELIVER      → Complete workspace + agent      │
└─────────────────────────────────────────────────────┘
```

## What's Inside

| File/Folder | Purpose |
|-------------|---------|
| `SKILL.md` | Main skill definition |
| `skills/` | Sub-skills (research, architecture, tooling, etc.) |
| `scripts/` | Executable scripts (scaffold, validate, dispatch) |
| `.workspace-templates/` | ICM workspace templates |

## The Iron Law

```
NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO TOOL DISCOVERY BEFORE AGENT DELIVERY
NO IMPROVEMENT WITHOUT VALIDATION
```

## Requirements

- Node.js 18+
- npm or yarn
- An AI agent (OpenCode, Claude, Copilot, or Gemini)

## Contributing

Contributions welcome! Please read the [contributing guide](CONTRIBUTING.md) first.

## License

MIT © [Eric Julian Deguzman](https://github.com/ericjdz)

---

<p align="center">Made with 🚀 by the workspace-maxxing team</p>
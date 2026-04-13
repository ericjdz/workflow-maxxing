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

> AI-powered workspace automation. Build structured workflows with one command.

## What is workspace-maxxing?

**workspace-maxxing** is an AI agent skill that creates production-ready workflows in seconds. Instead of manually creating folders, writing prompts, and configuring agents—let AI do it for you.

### What it builds:

```
📁 lead-scraper/
├── .agents/skills/@lead-scraper/   ← Invokable agent
├── 01-input/                     ← Stage 1
├── 02-process/                   ← Stage 2  
├── 03-output/                    ← Stage 3
├── 00-meta/                      ← Tools & logs
├── SYSTEM.md                     ← Rules
└── CONTEXT.md                   ← Routing
```

Then invoke with `@lead-scraper` and AI runs your workflow.

---

## Quick Start (30 seconds)

### Step 1: Install

```bash
npx workspace-maxxing install
```

### Step 2: Invoke

In your AI agent:

```
@workspace-maxxing
```

### Step 3: Ask

```
"Create a workspace for lead scraping"
```

Done. AI creates your workspace with an invokable agent.

---

## Use Cases

### 1. Lead Generation Workflow

```
You: "Create a lead generation workspace with stages for scraping, enrichment, and export"

AI creates:
📁 lead-gen/
├── 01-input/     → Prospect lists, target criteria
├── 02-enrich/    → Company research, contact finding
├── 03-export/    → CSV export, deduplication
└── @lead-gen    → Your reusable agent
```

**Invoking the agent:**
```
@lead-gen
"Find me CTOs at AI startups in San Francisco"
```

---

### 2. Content Creation Pipeline

```
You: "Create a content workflow with research, writing, and editing stages"

AI creates:
📁 content-pipeline/
├── 01-research/  → Topic analysis, competitor review
├── 02-writing/   → Draft creation
├── 03-editing/   → Proofreading, SEO optimization
└── @content-creator
```

**Use it:**
```
@content-creator
"Write about AI agents in 2026"
```

---

### 3. Code Review Process

```
You: "Create a code review workspace"

AI creates:
📁 code-review/
├── 01-submit/    → PR links, context
├── 02-review/   → Security, performance, style checks
├── 03-feedback/ → Summarized comments
└── @code-reviewer
```

---

### 4. Meeting Notes Analyzer

```
You: "Create a workspace for analyzing meeting notes"

AI creates:
📁 meeting-notes/
├── 01-import/    → Upload transcripts
├── 02-extract/   → Action items, decisions
├── 03-organize/  → Tag and categorize
└── @meeting-notes
```

---

### 5. Customer Support Triage

```
You: "Create a support ticket triage workflow"

AI creates:
📁 support-triage/
├── 01-intake/    → Ticket categorization
├── 02-route/     → Priority assignment
├── 03-respond/   → Draft responses
└── @support-bot
```

---

## Sub-Skills

When using workspace-maxxing, you have access to specialized sub-skills:

### /skill research
Analyze requirements before building
```
/skill research --workspace ./my-workspace
```

### /skill architecture
Design the workspace structure
```
/skill architecture --workspace ./my-workspace
```

### /skill tooling
Install required tools
```
/skill tooling --workspace ./my-workspace
```

### /skill validation
Check ICM compliance
```
/skill validation --workspace ./my-workspace
```

### /skill iteration
Improve until robust
```
/skill iteration --workspace ./my-workspace
```

---

## Commands Reference

### CLI

```bash
# Install the skill
npx workspace-maxxing install

# Create workspace with custom stages
npx workspace-maxxing init --workspace-name "My Workflow" --stages "01-input,02-process,03-output"

# Create workspace without agent (structure only)
npx workspace-maxxing init --workspace-name "Research" --no-agent

# Install for specific platform
npx workspace-maxxing --claude      # For Claude Code
npx workspace-maxxing --copilot     # For GitHub Copilot
npx workspace-maxxing --gemini     # For Gemini CLI
```

### In Your AI Agent

| Request | What Happens |
|---------|-------------|
| `"Build a workspace for X"` | Creates ICM workspace + agent |
| `"Create an agent for Y"` | Creates invokable @agent |
| `"Validate my workspace"` | Checks ICM compliance |
| `"Improve my workspace"` | Runs autonomous iteration |
| `"Add tools for Z"` | Installs required tools |

---

## How It Works

```
┌─────────────────────────────────────────────┐
│ @workspace-maxxing                         │
├─────────────────────────────────────────────┤
│ 1. RESEARCH    → What do you need?        │
│ 2. TOOLING     → What tools required?      │
│ 3. ARCHITECTURE→ How should it look?       │
│ 4. BUILD       → Create folders & files   │
│ 5. AGENT       → Build invokable agent    │
│ 6. ITERATE    → Test and improve         │
│ 7. DELIVER    → Done + agent ready       │
└─────────────────────────────────────────────┘
```

---

## The Iron Law

```
NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO TOOL DISCOVERY BEFORE AGENT DELIVERY
NO IMPROVEMENT WITHOUT VALIDATION
```

---

## Requirements

- Node.js 18+
- npm or yarn
- An AI agent: OpenCode, Claude Code, GitHub Copilot, or Gemini CLI

---

## What's Inside

| File/Folder | Purpose |
|-------------|---------|
| `SKILL.md` | Main skill definition |
| `.agents/skills/` | Sub-skills for /skill commands |
| `scripts/` | Executable scripts |
| `.workspace-templates/` | Workspace templates |

---

## Examples

### Example 1: Simple Workspace

```bash
npx workspace-maxxing init --workspace-name "Daily Standup" --stages "01-update,02-blocking,03-action-items"
```

Creates:
```
daily-standup/
├── 01-update/       → Yesterday's progress
├── 02-blocking/     → Current blockers
├── 03-action-items/ → Today's priorities
└── @daily-standup
```

---

### Example 2: Custom Agent Name

```bash
npx workspace-maxxing init --workspace-name "Content Writer" --agent-name "@writer"
```

Creates `@writer` agent:
```
@writer
"Write a blog post about AI trends"
```

---

### Example 3: Multi-Stage Pipeline

```bash
npx workspace-maxxing init \
  --workspace-name "Data Pipeline" \
  --stages "01-ingest,02-transform,03-validate,04-export"
```

---

## Platform Support

| Platform | Installation | Invoking |
|----------|-------------|---------|
| **OpenCode** | `npx workspace-maxxing install` | `@workspace-maxxing` |
| **Claude Code** | `npx workspace-maxxing --claude` | `@workspace-maxxing` |
| **GitHub Copilot** | `npx workspace-maxxing --copilot` | `@workspace-maxxing` |
| **Gemini CLI** | `npx workspace-maxxing --gemini` | `@workspace-maxxing` |

---

## Contributing

Contributions welcome! Please read the [contributing guide](CONTRIBUTING.md) first.

---

## License

MIT © [Eric Julian Deguzman](https://github.com/ericjdz)

---

<p align="center">Made with 🚀 by the workspace-maxxing team</p>
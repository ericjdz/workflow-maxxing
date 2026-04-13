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

> Describe what you need. AI builds your workflow.

---

## Quick Start

### Step 1: Install

```bash
npx workspace-maxxing install
```

### Step 2: Tell AI What You Want

```
@workspace-maxxing

"I need a lead generation workflow"
```

That's it. AI creates everything.

---

## What to Say

Just describe what you need in plain language:

| Say This | AI Builds |
|---------|----------|
| `"I need a lead generation workflow"` | Lead gen workspace + `@lead-gen` agent |
| `"Create a content pipeline"` | Content workflow + `@content-creator` |
| `"Build a code review process"` | Code review workspace + `@code-reviewer` |
| `"Make a meeting notes analyzer"` | Notes workflow + `@meeting-notes` |
| `"I want a customer support bot"` | Support workflow + `@support-bot` |
| `"Create a daily standup workflow"` | Standup workflow + `@daily-standup` |

AI figures out stages, names, and structure automatically.

---

## Using Your Agent

Once created, just talk to your agent:

```
@lead-gen
"Find me CTOs at AI startups in San Francisco"
```

```
@content-creator
"Write about AI agents in 2026"
```

---

## How It Works

```
You → @workspace-maxxing → "I need a [your idea] workflow"
      ↓
AI analyzes what you need (uses /skill research)
      ↓
AI determines tools needed (uses /skill tooling)
      ↓
AI designs folder structure (uses /skill architecture)
      ↓
AI creates folders & files (BUILD phase)
      ↓
AI builds your invokable agent
      ↓
AI tests and improves until robust (uses /skill iteration)
      ↓
@your-agent is ready
```

---

## Sub-Skills (Used During Build)

workspace-maxxing uses these specialized skills internally:

| Skill | What It Does |
|-------|-----------|
| `research` | Analyzes requirements |
| `tooling` | Determines required tools |
| `architecture` | Designs folder structure |
| `validation` | Checks ICM compliance |
| `iteration` | Tests and improves until robust |

---

## The Iron Law

```
NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO TOOL DISCOVERY BEFORE AGENT DELIVERY
NO IMPROVEMENT WITHOUT VALIDATION
```

---

## Platform Support

| Platform | Installation | Invoking |
|----------|--------------|----------|
| OpenCode | `npx workspace-maxxing install` | `@workspace-maxxing` |
| Claude Code | `npx workspace-maxxing --claude` | `@workspace-maxxing` |
| GitHub Copilot | `npx workspace-maxxing --copilot` | `@workspace-maxxing` |
| Gemini CLI | `npx workspace-maxxing --gemini` | `@workspace-maxxing` |

---

## What's Inside

| File/Folder | Purpose |
|-------------|---------|
| `SKILL.md` | Main skill definition |
| `.agents/skills/` | Sub-skills (research, architecture, tooling, etc.) |
| `scripts/` | Executable scripts (scaffold, validate, dispatch) |
| `.workspace-templates/` | ICM workspace templates |

---

## Requirements

- Node.js 18+
- npm or yarn
- An AI agent: OpenCode, Claude Code, GitHub Copilot, or Gemini CLI

---

## Contributing

Contributions welcome! Please read the [contributing guide](CONTRIBUTING.md) first.

---

## License

MIT © [Eric Julian Deguzman](https://github.com/ericjdz)

---

<p align="center">Made with 🚀</p>
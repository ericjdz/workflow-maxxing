# Sub-Project 4: Benchmarking & Multi-Agent Support — Design Spec

## Overview

Add weighted benchmark scoring, multi-agent CLI installation targeting, guided iteration reports, and console+JSON benchmark output to workspace-maxxing.

## Architecture

### New File: `src/scripts/benchmark.ts`

Zero-dependency Node.js script. Exports:
- `calculateBenchmark(workspacePath: string)` — scans workspace, calls validate logic, applies weights, returns benchmark data object
- `formatBenchmarkTable(data)` — returns formatted string for console output
- `saveBenchmarkReport(workspacePath, data)` — writes JSON to `.workspace-benchmarks/<name>-<timestamp>.json`

### Weighted Scoring Engine

**Default weights:**
| Stage | Weight | Rationale |
|-------|--------|-----------|
| `01-ideation` | 1.5x | Core thinking quality — most critical |
| `02-research` | 1.3x | Evidence gathering — high importance |
| `03-architecture` | 1.2x | Structural decisions — important |
| All other stages | 1.0x | Baseline |

**Formula:**
```
weightedStageScore = rawStageScore × weight
finalScore = Σ(weightedStageScores) / Σ(appliedWeights) × (100 / maxRawScore)
```

- Stages that don't exist in a workspace are excluded from both numerator and denominator
- `maxRawScore` = 45 (the per-stage cap from validate.ts)
- Final score normalized to 0-100

### Multi-Agent CLI Flags

**Flag behavior:**
| Flag | Installation Target |
|------|-------------------|
| (none) | `.agents/skills/workspace-maxxing/` (agent-agnostic default) |
| `--opencode` | `.agents/skills/workspace-maxxing/` (same as default) |
| `--claude` | `.claude/skills/` |
| `--copilot` | `.github/copilot-instructions/` |
| `--gemini` | `.gemini/skills/` |

**Implementation:**
- `src/index.ts` parses flags before install
- `install.ts` receives `targetAgent` parameter
- Agent-specific paths defined in a single config map
- All scripts and templates remain identical — only destination changes
- SKILL.md includes metadata note about which agent it was installed for (no behavioral changes)

### Guided Iteration Reports

**Flow:**
1. Agent runs `iterate.ts`
2. Each pass: `validate.ts` → `benchmark.ts` → structured report returned
3. Report includes: current score, weighted benchmark score, per-stage breakdown, fix suggestions, `improvementPotential` flag
4. Agent decides whether to apply fixes and re-run
5. No automatic looping — agent is in control

**Report structure:**
```json
{
  "workspace": "my-project",
  "agent": "opencode",
  "timestamp": "2026-04-07T...",
  "rawScore": 72,
  "weightedScore": 78,
  "stages": [
    { "name": "01-ideation", "raw": 85, "weight": 1.5, "weighted": 95 },
    { "name": "02-research", "raw": 60, "weight": 1.3, "weighted": 58 }
  ],
  "fixSuggestions": ["Add research sources to 02-research", "Expand architecture diagrams"],
  "improvementPotential": true
}
```

### Benchmark Output

**Console:** Formatted table with stage names, raw scores, weights, weighted scores, and total.

**JSON:** Saved to `.workspace-benchmarks/<workspace-name>-<timestamp>.json` with full metadata: workspace path, agent flag used, timestamp, all scores, weights applied.

## Integration Points

- `validate.ts` already returns per-stage scores — `benchmark.ts` consumes those and applies weights
- `iterate.ts` calls `validate.ts` internally — extended return value includes weighted benchmark data
- `install.ts` enhanced with agent-targeting flag parsing
- `src/index.ts` enhanced with CLI flag parsing for `--claude`, `--copilot`, `--gemini`, `--opencode`

## Testing Strategy

- `tests/benchmark.test.ts` — weighted scoring calculations, edge cases (missing stages, zero scores, normalization)
- `tests/cli-flags.test.ts` — flag parsing and installation targeting
- `tests/iterate-enhanced.test.ts` — guided iteration report structure
- All existing tests must continue passing (75/75 baseline)

## Constraints

- Zero external dependencies (Node.js builtins only: `fs`, `path`, `process`, `child_process`)
- Scripts invoked via shell commands, not as CLI flags on main package
- Agent-agnostic by default (no flag = universal behavior)
- Guided iterations only (no autonomous hill-climbing loop)

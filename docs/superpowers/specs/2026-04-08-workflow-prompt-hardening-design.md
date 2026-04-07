# Workflow Prompt Hardening for Scaffolded Workspaces — Design Spec

## Overview

Harden generated workspace prompts so agents reliably follow the intended workflow stages and loading discipline. This design upgrades scaffolded `SYSTEM.md`, root `CONTEXT.md`, and stage-level `CONTEXT.md` generation, aligns shipped template docs to the same structure, and introduces stricter validation checks that enforce both structure and workflow semantics.

## Goals

1. Make scaffold-generated prompts robust enough to guide stage-correct execution.
2. Ensure prompt structures are consistent across generated workspaces and shipped templates.
3. Enforce workflow contracts through `validate.ts` so prompt regressions fail early.
4. Preserve existing script ergonomics (same CLI usage and pass/fail exit behavior).

## Non-Goals

1. No anti-rationalization or iron-law requirement in validation for this phase.
2. No orchestrator or benchmark behavior changes.
3. No package or dependency changes (Node builtins only).

## Architecture

### 1) Generation Contract (Scaffold)

File: `src/scripts/scaffold.ts`

#### SYSTEM.md (root) required sections
- `## Role`
- `## Folder Map`
- `## Workflow Rules`
- `## Stage Boundaries`
- `## Tooling Policy`

The generated content must explicitly communicate:
- One-way stage dependencies.
- Numbered stage progression.
- Selective loading expectations.
- Canonical-source behavior (avoid duplication).

#### CONTEXT.md (root router) required sections
- `## How to Use This File`
- `## Task Routing`
- `## Loading Order`
- `## Stage Handoff Routing`
- `## Escalation`

The generated router must:
- Route workspace intents to specific stage context files.
- Include deterministic loading order (`SYSTEM.md` first, then root `CONTEXT.md`, then stage `CONTEXT.md`, then minimal task files).
- Describe how to move from one stage to the next.

#### Stage CONTEXT.md required sections
- `## Purpose`
- `## Inputs`
- `## Outputs`
- `## Dependencies`
- `## Completion Criteria`
- `## Handoff`

Each stage context must include enough contract detail to prevent generic or cross-stage ambiguous behavior.

### 2) Template Alignment

Files:
- `templates/.workspace-templates/SYSTEM.md`
- `templates/.workspace-templates/CONTEXT.md`
- `templates/.workspace-templates/workspace/01-input/CONTEXT.md`
- `templates/.workspace-templates/workspace/02-process/CONTEXT.md`
- `templates/.workspace-templates/workspace/03-output/CONTEXT.md`

These files will be updated to match the same generation contract so both:
- scaffolded workspaces, and
- packaged templates

provide consistent guidance quality.

### 3) Validation Contract (Structural + Workflow Strictness)

File: `src/scripts/validate.ts`

#### Root checks
- `SYSTEM.md` exists.
- `SYSTEM.md` contains required section headings.
- Root `CONTEXT.md` exists.
- Root `CONTEXT.md` contains required section headings.

#### Stage checks
For each numbered stage folder:
- `CONTEXT.md` exists and is non-empty.
- Stage `CONTEXT.md` contains all required stage section headings.

#### Workflow consistency checks
- Every discovered numbered stage appears in root routing.
- Routed stage targets resolve to existing stage `CONTEXT.md` files.
- Root loading order enforces selective loading.
- Dependency direction rule: a stage must not depend on a later-numbered stage.

#### Output behavior
- Keep check-by-check result structure and human-readable console reporting.
- Keep exit semantics unchanged (`0` pass, `1` fail).

## Data Flow

1. `scaffold.ts` generates robust prompt contracts at root and stage levels.
2. Agents load root documents, route into stage contexts, and follow stage boundaries.
3. `validate.ts` enforces structural and workflow contracts.
4. Iteration/orchestration logic consumes stronger workflow prompts and fails fast on doc drift.

## Testing Strategy (TDD)

### Scaffold tests (`tests/scaffold.test.ts`)
Add failing tests first for:
- SYSTEM required section headings.
- Root CONTEXT required section headings.
- Stage CONTEXT required section headings including Completion Criteria and Handoff.
- Root routing references all generated numbered stages.

### Validate tests (`tests/validate.test.ts`)
Add failing tests first for:
- Missing SYSTEM required sections.
- Missing root CONTEXT required sections.
- Missing stage required sections.
- Missing stage routing coverage in root router.
- Dependency direction violation (later-stage dependency).

### Regression checks
- Existing scaffold/validate expectations that remain valid should still pass.
- Run targeted suites first, then full suite and build.

## Risks and Mitigations

1. Risk: False negatives from strict heading checks.
- Mitigation: validate by section headings that are stable and intentionally generated.

2. Risk: Overly rigid wording constraints.
- Mitigation: enforce section presence and key workflow semantics, not full text equality.

3. Risk: Breakage in existing test fixtures.
- Mitigation: update fixture content only where new contract explicitly requires it.

## Acceptance Criteria

1. Scaffold-generated `SYSTEM.md`, root `CONTEXT.md`, and stage `CONTEXT.md` files contain all required sections.
2. Shipped template docs use the same robust structure.
3. `validate.ts` fails when required sections or workflow consistency rules are violated.
4. Focused scaffold and validate test suites pass.
5. Full repository test suite and TypeScript build pass.

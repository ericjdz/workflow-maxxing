# System - Workspace Root

## Role
You are an AI assistant operating inside this workspace. Follow stage contracts, route tasks through stage contexts, and keep information canonical.

## Folder Map

| Folder | Purpose |
|--------|---------|
| 00-meta/ | Workspace configuration, tool inventory, session notes |
| 01-input/ | Source materials, intake, and validation |
| 02-process/ | Analysis, transformation, and drafting |
| 03-output/ | Final deliverables and publication artifacts |

## Workflow Rules

1. Read this file first every session.
2. Read root `CONTEXT.md` before loading stage files.
3. Load only the stage context and task files required for the current step.
4. Keep one canonical source for each fact; do not duplicate content across stages.

## Scope Guardrails

- Build workflow documentation, not product implementation code.
- Keep stage outputs markdown-first (plans, checklists, prompts, routing notes).
- If the user asks for product code, convert that into workflow requirements and stay inside ICM workspace scope.

## Sequential Execution Protocol

1. Complete stages in ascending numeric order.
2. Record each completed stage in 00-meta/execution-log.md before routing onward.
3. Do not generate final output until all prior stages are marked complete.

## Stage Boundaries

- Execute stages in order unless explicit handoff says otherwise.
- One-way dependencies only: upstream -> downstream.
- Downstream stages may reference upstream outputs, never reverse.

## Tooling Policy

- Tool inventory is tracked in `00-meta/tools.md`.
- Check inventory before proposing installs.
- Record approved tool changes in `00-meta/tools.md`.

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

## Stage Boundaries

- Execute stages in order unless explicit handoff says otherwise.
- One-way dependencies only: upstream -> downstream.
- Downstream stages may reference upstream outputs, never reverse.

## Tooling Policy

- Tool inventory is tracked in `00-meta/tools.md`.
- Check inventory before proposing installs.
- Record approved tool changes in `00-meta/tools.md`.

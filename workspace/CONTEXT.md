# NoAgent Test — Context Router

## How to Use This File
Use this file to route each task to the smallest required context scope.

## Task Routing
This routing table maps task intent to the correct stage context.

| When you need to... | Load | Why |
|---------------------|------|-----|
| Understand workspace constraints | `SYSTEM.md` | Global rules and stage boundaries |
| Work in 01-input tasks | `01-input/CONTEXT.md` | Stage contract and required outputs |
| Check available tools | `00-meta/tools.md` | Tool inventory and approval status |

## Loading Order
1. `SYSTEM.md` (always)
2. This root `CONTEXT.md`
3. One relevant stage `CONTEXT.md`
4. Only the task files needed for that stage

## Scope Guardrails
- Route domain requests into workflow design steps and markdown deliverables.
- Do not scaffold backend, frontend, or runtime product source files from this router.
- Keep outputs file-structured and markdown-first across numbered workflow folders.

## Sequential Routing Contract
- Route only to the earliest incomplete stage in `00-meta/execution-log.md`.
- Refuse jumps to later stages when earlier stages are not marked complete.
- Append handoff notes for each completed stage before routing onward.

## Stage Handoff Routing
- `01-input` -> deliver final output and close loop

## Escalation
Escalate when required sections are missing, dependencies are contradictory, or no valid stage route can satisfy the task.

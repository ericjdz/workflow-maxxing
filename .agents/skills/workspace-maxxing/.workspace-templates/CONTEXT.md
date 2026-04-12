# Routing Table

## How to Use This File

Map each task to the smallest required context and avoid loading unrelated files.

## Task Routing

| When you need to... | Go to | Load |
|---------------------|-------|------|
| Understand workspace constraints | SYSTEM.md | Always loaded first |
| Gather or validate inputs | 01-input/CONTEXT.md | Input stage contract |
| Analyze, process, or draft | 02-process/CONTEXT.md | Processing stage contract |
| Finalize and deliver outputs | 03-output/CONTEXT.md | Output stage contract |
| Check available tools | 00-meta/tools.md | Tool inventory |

## Loading Order

1. SYSTEM.md (always)
2. This root CONTEXT.md
3. One relevant stage CONTEXT.md
4. Only the task files needed for that stage

## Scope Guardrails

- Route domain goals into workflow design stages and markdown deliverables.
- Do not scaffold backend, frontend, or runtime product repositories from this routing file.
- Keep artifacts file-structured and markdown-first across numbered workflow folders.

## Sequential Routing Contract

- Route to the earliest incomplete stage listed in 00-meta/execution-log.md.
- Do not skip forward to later stages while earlier stages remain incomplete.
- Append handoff notes after each completed stage before advancing.

## Stage Handoff Routing

- 01-input -> 02-process when input completion criteria are met
- 02-process -> 03-output when processing completion criteria are met
- 03-output -> delivery and closure

## Escalation

Escalate when required sections are missing, routing is ambiguous, or dependencies conflict with stage order.

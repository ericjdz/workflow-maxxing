# Routing Table

## How to Use This File

This file maps tasks to workspaces. Read the task description, find the matching entry, and load only the files listed.

## Task Routing

| When you need to... | Go to | Load |
|---------------------|-------|------|
| Understand workspace structure | SYSTEM.md | Always loaded |
| Gather inputs or research | 01-input/CONTEXT.md | Stage-specific routing |
| Process, analyze, or draft | 02-process/CONTEXT.md | Stage-specific routing |
| Produce final output | 03-output/CONTEXT.md | Stage-specific routing |
| Check available tools | 00-meta/tools.md | Tool inventory |

## Loading Order

1. SYSTEM.md (always)
2. This file (once per session)
3. The relevant workspace CONTEXT.md
4. Only the content files your task needs

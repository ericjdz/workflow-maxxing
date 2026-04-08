# 01-input CONTEXT.md

## Purpose
Collect, validate, and normalize workflow inputs.

## Inputs
- Raw user input and source artifacts
- Intake constraints and acceptance boundaries

## Outputs
- Validated input package ready for processing
- Input assumptions and constraints summary
- Markdown workflow artifacts only (no product source code)

## Dependencies
- None (entry stage)

## Required Evidence
- Update 00-meta/execution-log.md when 01-input is complete
- Link the markdown artifacts produced in this stage

## Completion Criteria
- Inputs are validated and normalized
- Required fields are present
- Handoff package is complete
- Stage artifacts remain markdown-first and workflow-scoped

## Handoff
- Hand off validated package to 02-process

# Sub-Skill Report Format

All sub-skills return a structured JSON report. Use this exact format.

## Report Structure

```json
{
  "skill": "<skill-name>",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601 timestamp>",
  "findings": [
    "<specific finding 1>",
    "<specific finding 2>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>"
  ],
  "metrics": {
    "<metric-name>": <value>,
    "score": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>
  },
  "nextSkill": "<next-skill-name>|none"
}
```

## Field Descriptions

- `skill`: Name of the sub-skill that generated this report
- `status`: One of "passed", "failed", or "escalated"
  - `passed`: All checks passed, no critical issues
  - `failed`: One or more checks failed, actionable items exist
  - `escalated`: Cannot proceed, requires human intervention
- `timestamp`: ISO-8601 timestamp of report generation
- `findings`: Array of specific observations (both positive and negative)
- `recommendations`: Array of actionable next steps
- `metrics`: Quantitative measurements from the sub-skill
  - `score`: 0-100 quality score
  - `itemsChecked`: Total items evaluated
  - `itemsPassed`: Items that passed evaluation
- `nextSkill`: Suggested next sub-skill to dispatch, or "none" if workflow is complete

## Usage

Print the report as JSON to stdout when the sub-skill completes:

```bash
echo '{"skill":"validation","status":"passed",...}'
```

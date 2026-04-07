import * as fs from 'fs';
import * as path from 'path';

export interface DispatchReport {
  skill: string;
  status: 'passed' | 'failed' | 'escalated';
  timestamp: string;
  findings: string[];
  recommendations: string[];
  metrics: Record<string, number>;
  nextSkill: string;
}

export interface ParallelInvocation {
  skill: string;
  batchId: number;
  testCaseId: string;
}

export interface ParallelDispatchResult extends DispatchReport {
  batchId: number;
  testCaseId: string;
}

const SKILL_NEXT_MAP: Record<string, string> = {
  research: 'architecture',
  architecture: 'none',
  validation: 'prompt-engineering',
  'prompt-engineering': 'testing',
  testing: 'iteration',
  iteration: 'none',
  tooling: 'none',
  worker: 'validation',
  fixer: 'validation',
};

export function dispatchSkill(skillName: string, skillsDir: string): DispatchReport {
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return {
      skill: skillName,
      status: 'failed',
      timestamp: new Date().toISOString(),
      findings: [`Sub-skill SKILL.md not found: ${skillPath}`],
      recommendations: ['Ensure the sub-skill directory and SKILL.md exist'],
      metrics: {},
      nextSkill: 'none',
    };
  }

  const content = fs.readFileSync(skillPath, 'utf-8');
  const nameMatch = content.match(/^---\nname:\s*(.+)$/m);
  const skill = nameMatch ? nameMatch[1].trim() : skillName;

  return {
    skill,
    status: 'passed',
    timestamp: new Date().toISOString(),
    findings: [`Sub-skill "${skill}" loaded successfully`],
    recommendations: ['Follow the sub-skill instructions to complete the task'],
    metrics: {
      contentLength: content.length,
    },
    nextSkill: SKILL_NEXT_MAP[skillName] ?? 'none',
  };
}

export function dispatchParallel(
  invocations: ParallelInvocation[],
  skillsDir: string,
): ParallelDispatchResult[] {
  return invocations.map((inv) => {
    const report = dispatchSkill(inv.skill, skillsDir);
    return {
      ...report,
      batchId: inv.batchId,
      testCaseId: inv.testCaseId,
    };
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const skill = parseArg('--skill');
  const workspace = parseArg('--workspace');
  const batchId = parseArg('--batch-id');
  const parallel = args.includes('--parallel');
  const invocationsPath = parseArg('--invocations');

  const skillsDir = workspace
    ? path.join(workspace, '.agents', 'skills', 'workspace-maxxing', 'skills')
    : path.join(process.cwd(), 'skills');

  if (parallel) {
    if (!invocationsPath) {
      console.error('--parallel requires --invocations <path>');
      process.exit(1);
    }

    const parsed = JSON.parse(fs.readFileSync(invocationsPath, 'utf-8'));
    if (!Array.isArray(parsed)) {
      console.error('--invocations must point to a JSON array');
      process.exit(1);
    }

    const results = dispatchParallel(parsed as ParallelInvocation[], skillsDir);
    console.log(JSON.stringify(results, null, 2));
  } else {
    if (!skill) {
      console.error('Usage: node dispatch.ts --skill <name> --workspace <path> [--batch-id <n>] [--parallel --invocations <path>]');
      process.exit(1);
    }

    const result = dispatchSkill(skill, skillsDir);
    const output = batchId
      ? { ...result, batchId: parseInt(batchId, 10) }
      : result;
    console.log(JSON.stringify(output, null, 2));
  }
}

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

const SKILL_NEXT_MAP: Record<string, string> = {
  research: 'architecture',
  architecture: 'none',
  validation: 'prompt-engineering',
  'prompt-engineering': 'testing',
  testing: 'iteration',
  iteration: 'none',
  tooling: 'none',
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

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const skill = parseArg('--skill');
  const workspace = parseArg('--workspace');

  if (!skill) {
    console.error('Usage: node dispatch.ts --skill <name> --workspace <path>');
    process.exit(1);
  }

  const skillsDir = workspace
    ? path.join(workspace, '.agents', 'skills', 'workspace-maxxing', 'skills')
    : path.join(process.cwd(), 'skills');

  const result = dispatchSkill(skill, skillsDir);
  console.log(JSON.stringify(result, null, 2));
}

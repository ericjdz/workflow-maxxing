import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dispatchSkill, DispatchReport } from '../src/scripts/dispatch';

describe('dispatchSkill', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads and returns report for a valid sub-skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.skill).toBe('validation');
    expect(result.status).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('returns failed status for non-existent skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const result = dispatchSkill('nonexistent', skillsDir);

    expect(result.skill).toBe('nonexistent');
    expect(result.status).toBe('failed');
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('includes nextSkill recommendation in report', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.nextSkill).toBeDefined();
  });

  it('maps validation to prompt-engineering as next skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('validation', skillsDir);

    expect(result.nextSkill).toBe('prompt-engineering');
  });

  it('maps research to architecture as next skill', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'research'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'research', 'SKILL.md'), '---\nname: research\ndescription: test\n---\n\n## Overview\nTest');

    const result = dispatchSkill('research', skillsDir);

    expect(result.nextSkill).toBe('architecture');
  });
});

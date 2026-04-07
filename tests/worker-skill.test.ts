import * as fs from 'fs';
import * as path from 'path';

describe('worker sub-skill', () => {
  const skillPath = path.join(__dirname, '..', 'templates', '.workspace-templates', 'skills', 'worker', 'SKILL.md');

  it('exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has YAML frontmatter at the top with required keys', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

    expect(frontmatterMatch).not.toBeNull();

    if (!frontmatterMatch) {
      return;
    }

    const frontmatter = frontmatterMatch[1];

    expect(frontmatter).toMatch(/^name:\s*worker\s*$/m);
    expect(frontmatter).toMatch(/^description:\s*".+"\s*$/m);
    expect(frontmatter).toMatch(/^triggers:\s*\[[^\]]+\]\s*$/m);

    const firstHeadingIndex = content.indexOf('\n## ');
    expect(firstHeadingIndex).toBeGreaterThan(frontmatterMatch[0].length - 1);

    const betweenFrontmatterAndFirstHeading = content
      .slice(frontmatterMatch[0].length, firstHeadingIndex)
      .trim();
    expect(betweenFrontmatterAndFirstHeading).toBe('');
  });

  it('has Iron Law section', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('the iron law');
  });

  it('has Anti-Rationalization Table', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('| Thought | Reality |');
  });

  it('has Report Format section with required worker report fields', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('report format');

    const reportJsonBlockMatch = content.match(/## Report Format[\s\S]*?```json\r?\n([\s\S]*?)\r?\n```/i);
    expect(reportJsonBlockMatch).not.toBeNull();

    if (!reportJsonBlockMatch) {
      return;
    }

    const reportSample = JSON.parse(reportJsonBlockMatch[1]);

    expect(reportSample).toEqual(
      expect.objectContaining({
        skill: 'worker',
        status: expect.any(String),
        timestamp: expect.any(String),
        testCaseId: expect.any(String),
        batchId: expect.any(Number),
        findings: expect.any(Array),
        recommendations: expect.any(Array),
        metrics: expect.any(Object),
        nextSkill: 'validation',
      }),
    );

    expect(reportSample.metrics).toEqual(
      expect.objectContaining({
        executionTimeMs: expect.any(Number),
        outputLength: expect.any(Number),
      }),
    );
  });

  it('keeps Process report shape aligned with Report Format fields', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');

    expect(content).toContain('Write report.json');
    expect(content).toContain('{skill, status, timestamp, testCaseId, batchId, findings, recommendations, metrics, nextSkill}');
    expect(content).not.toContain('{testCaseId, status, output, findings}');
  });
});
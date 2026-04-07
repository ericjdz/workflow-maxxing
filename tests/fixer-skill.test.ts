import * as fs from 'fs';
import * as path from 'path';

describe('fixer sub-skill', () => {
  const skillPath = path.join(__dirname, '..', 'templates', '.workspace-templates', 'skills', 'fixer', 'SKILL.md');
  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parseInlineYamlArray = (value: string): string[] =>
    value
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter((item) => item.length > 0);
  const getSectionBody = (content: string, heading: string): string | null => {
    const headingPattern = escapeRegExp(heading);
    const sectionMatch = content.match(
      new RegExp(`##\\s+${headingPattern}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, 'i'),
    );

    return sectionMatch ? sectionMatch[1] : null;
  };

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

    expect(frontmatter).toMatch(/^name:\s*fixer\s*$/m);

    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
    expect(descriptionMatch).not.toBeNull();
    expect(descriptionMatch?.[1].trim()).not.toBe('');

    const triggersLineMatch = frontmatter.match(/^triggers:\s*(.*)$/m);
    expect(triggersLineMatch).not.toBeNull();

    const triggersInlineValue = triggersLineMatch?.[1].trim() ?? '';
    if (/^\[.*\]$/.test(triggersInlineValue)) {
      const triggerItems = parseInlineYamlArray(triggersInlineValue);
      expect(triggerItems.length).toBeGreaterThan(0);
    } else {
      expect(triggersInlineValue).toBe('');

      const triggersBlockMatch = frontmatter.match(/^triggers:\s*\r?\n((?:\s*-\s+.+\r?\n?)*)/m);
      expect(triggersBlockMatch).not.toBeNull();

      const triggerItems = (triggersBlockMatch?.[1] ?? '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^-\s+/, '').trim())
        .filter((line) => line.length > 0);

      expect(triggerItems.length).toBeGreaterThan(0);
    }

    const firstHeadingIndex = content.indexOf('\n## ');
    expect(firstHeadingIndex).toBeGreaterThan(frontmatterMatch[0].length - 1);

    const betweenFrontmatterAndFirstHeading = content
      .slice(frontmatterMatch[0].length, firstHeadingIndex)
      .trim();
    expect(betweenFrontmatterAndFirstHeading).toBe('');
  });

  it('has required sections', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');

    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## When Not to Use');
    expect(content).toContain('## The Iron Law');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Anti-Rationalization Table');
    expect(content).toContain('## Sub-Skill Dispatch');
    expect(content).toContain('## Report Format');
  });

  it('has Iron Law section', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const ironLawSection = getSectionBody(content, 'The Iron Law');

    expect(ironLawSection).not.toBeNull();

    if (!ironLawSection) {
      return;
    }

    expect(ironLawSection).toMatch(/NO BLIND RETRIES/i);
    expect(ironLawSection).toMatch(/NO COSMETIC FIXES/i);
    expect(ironLawSection).toMatch(/NO FIXING WHAT IS NOT BROKEN/i);
    expect(ironLawSection).toMatch(/NO CLAIMING FIX WITHOUT RE-?VALIDATION/i);
  });

  it('captures core fixer process semantics without brittle paragraph matching', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const processSection = getSectionBody(content, 'The Process');

    expect(processSection).not.toBeNull();

    if (!processSection) {
      return;
    }

    expect(processSection).toMatch(/root\s+cause[\s\S]{0,160}map[\s\S]{0,120}finding[\s\S]{0,120}defect/i);
    expect(processSection).toMatch(/minimal\s+fix[\s\S]{0,160}change\s+only[\s\S]{0,120}needed/i);
    expect(processSection).toMatch(/dispatch\s+validation[\s\S]{0,200}(after\s+fix|re-?validation)/i);
  });

  it('has Anti-Rationalization Table', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const antiRationalizationSection = getSectionBody(content, 'Anti-Rationalization Table');

    expect(antiRationalizationSection).not.toBeNull();

    if (!antiRationalizationSection) {
      return;
    }

    expect(antiRationalizationSection).toContain('| Thought | Reality |');
    expect(antiRationalizationSection).toMatch(/re-?run the worker logic/i);
    expect(antiRationalizationSection).toMatch(/blind retries/i);
    expect(antiRationalizationSection).toMatch(/fix other things while i am here/i);
    expect(antiRationalizationSection).toMatch(/scope creep/i);
  });

  it('has Report Format section with required fixer report fields', () => {
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
        skill: 'fixer',
        status: expect.any(String),
        timestamp: expect.any(String),
        testCaseId: expect.any(String),
        batchId: expect.any(Number),
        findings: expect.any(Array),
        fixesApplied: expect.any(Array),
        recommendations: expect.any(Array),
        metrics: expect.any(Object),
        nextSkill: 'validation',
      }),
    );

    expect(reportSample.metrics).toEqual(
      expect.objectContaining({
        findingsAddressed: expect.any(Number),
        fixesApplied: expect.any(Number),
      }),
    );
  });

  it('keeps Process report shape aligned with Report Format fields', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const processSection = getSectionBody(content, 'The Process');

    expect(processSection).not.toBeNull();

    if (!processSection) {
      return;
    }

    expect(processSection).toMatch(/Write\s+report\.json/i);

    const requiredFields = [
      'skill',
      'status',
      'timestamp',
      'testCaseId',
      'batchId',
      'findings',
      'fixesApplied',
      'recommendations',
      'metrics',
      'nextSkill',
    ];

    for (const field of requiredFields) {
      expect(processSection).toMatch(new RegExp(`\\b${escapeRegExp(field)}\\b`, 'i'));
    }
  });
});

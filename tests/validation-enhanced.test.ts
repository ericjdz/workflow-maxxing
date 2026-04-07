import * as fs from 'fs';
import * as path from 'path';

describe('enhanced validation sub-skill', () => {
  const skillPath = path.join(
    __dirname,
    '..',
    'templates',
    '.workspace-templates',
    'skills',
    'validation',
    'SKILL.md',
  );

  type FrontmatterValue = string | string[];
  type ParsedFrontmatter = {
    boundaryLength: number;
    fields: Record<string, FrontmatterValue>;
  };

  const allowedNextSkills = ['fixer', 'orchestrator', 'none'] as const;

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const stripOuterQuotes = (value: string): string => value.trim().replace(/^['"]|['"]$/g, '').trim();

  const parseInlineYamlArray = (value: string): string[] =>
    value
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((item) => stripOuterQuotes(item))
      .filter((item) => item.length > 0);

  const parseFrontmatter = (content: string): ParsedFrontmatter | null => {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

    if (!frontmatterMatch) {
      return null;
    }

    const fields: Record<string, FrontmatterValue> = {};
    const lines = frontmatterMatch[1].split(/\r?\n/);
    let lineIndex = 0;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);

      if (!keyValueMatch) {
        lineIndex += 1;
        continue;
      }

      const [, key, rawValue] = keyValueMatch;

      if (key !== 'triggers') {
        fields[key] = stripOuterQuotes(rawValue);
        lineIndex += 1;
        continue;
      }

      const inlineTriggers = rawValue.trim();

      if (inlineTriggers.length > 0) {
        fields[key] = /^\[.*\]$/.test(inlineTriggers)
          ? parseInlineYamlArray(inlineTriggers)
          : [stripOuterQuotes(inlineTriggers)];
        lineIndex += 1;
        continue;
      }

      const triggerItems: string[] = [];
      lineIndex += 1;

      while (lineIndex < lines.length) {
        const candidateLine = lines[lineIndex];

        if (!candidateLine.trim()) {
          lineIndex += 1;
          continue;
        }

        if (/^[A-Za-z][A-Za-z0-9_-]*:\s*/.test(candidateLine)) {
          break;
        }

        const listItemMatch = candidateLine.match(/^\s*-\s+(.+?)\s*$/);

        if (listItemMatch) {
          triggerItems.push(stripOuterQuotes(listItemMatch[1]));
        }

        lineIndex += 1;
      }

      fields[key] = triggerItems;
    }

    return {
      boundaryLength: frontmatterMatch[0].length,
      fields,
    };
  };

  const getSectionBody = (content: string, heading: string): string | null => {
    const headingPattern = escapeRegExp(heading);
    const sectionMatch = content.match(
      new RegExp(`##\\s+${headingPattern}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, 'i'),
    );

    return sectionMatch ? sectionMatch[1] : null;
  };

  let content = '';
  let parsedFrontmatter: ParsedFrontmatter | null = null;

  beforeAll(() => {
    if (fs.existsSync(skillPath)) {
      content = fs.readFileSync(skillPath, 'utf-8');
      parsedFrontmatter = parseFrontmatter(content);
    }
  });

  it('exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has YAML frontmatter at the top with required keys and triggers', () => {
    expect(parsedFrontmatter).not.toBeNull();

    if (!parsedFrontmatter) {
      return;
    }

    expect(parsedFrontmatter.fields.name).toBe('validation');

    const descriptionValue = parsedFrontmatter.fields.description;
    expect(typeof descriptionValue).toBe('string');
    expect(String(descriptionValue).trim()).not.toBe('');

    const triggersValue = parsedFrontmatter.fields.triggers;
    expect(Array.isArray(triggersValue)).toBe(true);

    if (Array.isArray(triggersValue)) {
      expect(triggersValue.length).toBeGreaterThan(0);
      for (const trigger of triggersValue) {
        expect(trigger.trim()).not.toBe('');
      }
    }

    const firstHeadingIndex = content.search(/\r?\n##\s+/);
    expect(firstHeadingIndex).toBeGreaterThan(parsedFrontmatter.boundaryLength - 1);

    const betweenFrontmatterAndFirstHeading = content
      .slice(parsedFrontmatter.boundaryLength, firstHeadingIndex)
      .trim();
    expect(betweenFrontmatterAndFirstHeading).toBe('');
  });

  it('has required enhanced sections', () => {
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## When Not to Use');
    expect(content).toContain('## The Iron Law');
    expect(content).toContain('## The Process');
    expect(content).toContain('## Batch-Level Validation');
    expect(content).toContain('## Anti-Rationalization Table');
    expect(content).toContain('## Sub-Skill Dispatch');
    expect(content).toContain('## Report Format');
  });

  it('has the Task 7 validation Iron Law constraints', () => {
    const ironLawSection = getSectionBody(content, 'The Iron Law');

    expect(ironLawSection).not.toBeNull();

    if (!ironLawSection) {
      return;
    }

    expect(ironLawSection).toMatch(/NO\s+SCORE\s+INFLATION/i);
    expect(ironLawSection).toMatch(/NO\s+SKIPPING\s+FAILURES/i);
    expect(ironLawSection).toMatch(/NO\s+VALIDATING\s+WITHOUT\s+BENCHMARK/i);
    expect(ironLawSection).toMatch(/NO\s+PASSING\s+WITHOUT\s+EVIDENCE/i);
  });

  it('has anti-rationalization guidance tied to scoring and validation discipline', () => {
    const antiRationalizationSection = getSectionBody(content, 'Anti-Rationalization Table');

    expect(antiRationalizationSection).not.toBeNull();

    if (!antiRationalizationSection) {
      return;
    }

    expect(antiRationalizationSection).toContain('| Thought | Reality |');
    expect(antiRationalizationSection).toMatch(/round\s+up|score\s+inflation/i);
    expect(antiRationalizationSection).toMatch(/one\s+failure\s+does\s+not\s+matter|every\s+failure\s+matters/i);
    expect(antiRationalizationSection).toMatch(/re-?validate\s+after\s+every\s+change|re-?validate/i);
  });

  it('captures batch-level validation semantics and benchmark references', () => {
    const processSection = getSectionBody(content, 'The Process');
    const batchSection = getSectionBody(content, 'Batch-Level Validation');
    const dispatchSection = getSectionBody(content, 'Sub-Skill Dispatch');

    expect(processSection).not.toBeNull();
    expect(batchSection).not.toBeNull();
    expect(dispatchSection).not.toBeNull();

    if (!processSection || !batchSection || !dispatchSection) {
      return;
    }

    expect(processSection).toMatch(/validate\.ts/i);
    expect(processSection).toMatch(/benchmark\.ts/i);
    expect(processSection).toMatch(/batch-?report\.json/i);
    expect(processSection).toMatch(/nextSkill[\s\S]*fixer[\s\S]*orchestrator[\s\S]*none/i);

    expect(batchSection).toMatch(/\.agents\/iteration\/batch-<N>\//i);
    expect(batchSection).toMatch(/report\.json/i);
    expect(batchSection).toMatch(/per-?test-?case\s+pass\/?fail/i);
    expect(batchSection).toMatch(/overall\s+batch\s+score/i);
    expect(batchSection).toMatch(/score\s*<\s*threshold[\s\S]{0,80}fixer/i);

    for (const nextSkill of allowedNextSkills) {
      expect(dispatchSection).toMatch(new RegExp(`\\b${escapeRegExp(nextSkill)}\\b`, 'i'));
    }
  });

  it('has a parseable report format JSON block with benchmark-linked fields', () => {
    const reportJsonBlockMatch = content.match(/## Report Format[\s\S]*?```json\r?\n([\s\S]*?)\r?\n```/i);

    expect(reportJsonBlockMatch).not.toBeNull();

    if (!reportJsonBlockMatch) {
      return;
    }

    const reportSample = JSON.parse(reportJsonBlockMatch[1]);

    expect(reportSample).toEqual(
      expect.objectContaining({
        skill: 'validation',
        status: expect.any(String),
        timestamp: expect.any(String),
        batchId: expect.any(Number),
        findings: expect.any(Array),
        fixSuggestions: expect.any(Array),
        recommendations: expect.any(Array),
        metrics: expect.any(Object),
        nextSkill: expect.any(String),
      }),
    );

    expect(reportSample.metrics).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        benchmarkScore: expect.any(Number),
        itemsChecked: expect.any(Number),
        itemsPassed: expect.any(Number),
        testCasesPassed: expect.any(Number),
        testCasesFailed: expect.any(Number),
      }),
    );

    const normalizedNextSkill = String(reportSample.nextSkill).trim().toLowerCase();
    expect(
      allowedNextSkills.includes(normalizedNextSkill as (typeof allowedNextSkills)[number]),
    ).toBe(true);
  });

  it('keeps process report shape aligned with the report format fields', () => {
    const processSection = getSectionBody(content, 'The Process');

    expect(processSection).not.toBeNull();

    if (!processSection) {
      return;
    }

    expect(processSection).toMatch(/Write\s+batch-?report\.json/i);

    const requiredFields = [
      'skill',
      'status',
      'timestamp',
      'batchId',
      'findings',
      'fixSuggestions',
      'recommendations',
      'metrics',
      'nextSkill',
    ];

    for (const field of requiredFields) {
      expect(processSection).toMatch(new RegExp(`\\b${escapeRegExp(field)}\\b`, 'i'));
    }

    expect(processSection).toMatch(/nextSkill[\s\S]*fixer[\s\S]*orchestrator[\s\S]*none/i);
  });
});

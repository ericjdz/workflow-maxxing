import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

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

export interface DispatchOptions {
  workspacePath?: string;
  runnerCommand?: string;
  runnerTimeoutSeconds?: number;
  invocation?: ParallelInvocation;
}

export interface ParallelDispatchOptions {
  workspacePath?: string;
  runnerCommand?: string;
  runnerTimeoutSeconds?: number;
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

function isValidStatus(value: unknown): value is DispatchReport['status'] {
  return value === 'passed' || value === 'failed' || value === 'escalated';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item))
    .filter((item) => item.trim().length > 0);
}

function extractJsonPayload(output: string): Record<string, unknown> | null {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    // Continue trying to parse trailing JSON from mixed runner logs.
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = trimmed.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(candidate);
    return typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function renderRunnerCommand(
  template: string,
  skillName: string,
  options: DispatchOptions,
): string {
  const invocation = options.invocation;
  const replacements: Record<string, string> = {
    '{skill}': skillName,
    '{workspace}': options.workspacePath ?? process.cwd(),
    '{batchId}': invocation ? String(invocation.batchId) : '',
    '{testCaseId}': invocation?.testCaseId ?? '',
  };

  return template.replace(/\{skill\}|\{workspace\}|\{batchId\}|\{testCaseId\}/g, (token) => {
    return replacements[token] ?? token;
  });
}

function createRunnerFailureReport(
  skillName: string,
  message: string,
  nextSkill: string,
  metrics: Record<string, number> = {},
): DispatchReport {
  return {
    skill: skillName,
    status: 'failed',
    timestamp: new Date().toISOString(),
    findings: [message],
    recommendations: ['Inspect runner command and ensure it outputs a valid JSON report'],
    metrics,
    nextSkill,
  };
}

function truncateTelemetryText(value: string, maxLength: number = 2000): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function writeRunnerTelemetry(
  skillName: string,
  options: DispatchOptions,
  details: {
    commandTemplate: string;
    renderedCommand: string;
    status: DispatchReport['status'];
    timestamp: string;
    durationMs: number;
    exitCode: number;
    timedOut: number;
    stdout: string;
    stderr: string;
    parsedPayload: number;
  },
): void {
  try {
    const runsDir = path.join(options.workspacePath ?? process.cwd(), '.agents', 'iteration', 'runs');
    fs.mkdirSync(runsDir, { recursive: true });

    const batchToken = options.invocation ? String(options.invocation.batchId) : 'na';
    const testCaseToken = options.invocation?.testCaseId ? options.invocation.testCaseId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'na';
    const fileName = `${Date.now()}-${skillName}-${batchToken}-${testCaseToken}.json`;
    const filePath = path.join(runsDir, fileName);

    const telemetry = {
      skill: skillName,
      status: details.status,
      timestamp: details.timestamp,
      batchId: options.invocation?.batchId,
      testCaseId: options.invocation?.testCaseId,
      commandTemplate: details.commandTemplate,
      renderedCommand: details.renderedCommand,
      durationMs: details.durationMs,
      exitCode: details.exitCode,
      timedOut: details.timedOut,
      parsedPayload: details.parsedPayload,
      stdoutLength: details.stdout.length,
      stderrLength: details.stderr.length,
      stdoutPreview: truncateTelemetryText(details.stdout),
      stderrPreview: truncateTelemetryText(details.stderr),
    };

    fs.writeFileSync(filePath, JSON.stringify(telemetry, null, 2));
  } catch {
    // Best-effort telemetry; dispatch result should not fail due to telemetry write issues.
  }
}

function runExternalRunner(
  skillName: string,
  options: DispatchOptions,
): DispatchReport {
  if (!options.runnerCommand) {
    return createRunnerFailureReport(skillName, 'Runner command is required for external dispatch mode', 'none');
  }

  const command = renderRunnerCommand(options.runnerCommand, skillName, options);
  const startedAt = Date.now();
  const timeoutMs = (options.runnerTimeoutSeconds ?? 300) * 1000;

  try {
    const stdout = execFileSync(command, {
      cwd: options.workspacePath ?? process.cwd(),
      encoding: 'utf-8',
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });

    const parsed = extractJsonPayload(stdout);
    const elapsedMs = Date.now() - startedAt;
    const nextSkill = SKILL_NEXT_MAP[skillName] ?? 'none';

    const commandTemplate = options.runnerCommand ?? '';

    if (!parsed) {
      const report: DispatchReport = {
        skill: skillName,
        status: 'passed',
        timestamp: new Date().toISOString(),
        findings: ['External runner completed without JSON payload'],
        recommendations: ['Emit JSON report for richer metrics and routing decisions'],
        metrics: {
          executionTimeMs: elapsedMs,
          outputLength: stdout.length,
        },
        nextSkill,
      };

      writeRunnerTelemetry(skillName, options, {
        commandTemplate,
        renderedCommand: command,
        status: report.status,
        timestamp: report.timestamp,
        durationMs: elapsedMs,
        exitCode: 0,
        timedOut: 0,
        stdout,
        stderr: '',
        parsedPayload: 0,
      });

      return report;
    }

    const findings = normalizeStringArray(parsed.findings);
    const recommendations = normalizeStringArray(parsed.recommendations);
    const rawMetrics = parsed.metrics;
    const metrics = typeof rawMetrics === 'object' && rawMetrics !== null
      ? rawMetrics as Record<string, number>
      : {};

    const report: DispatchReport = {
      skill: typeof parsed.skill === 'string' && parsed.skill.trim()
        ? parsed.skill
        : skillName,
      status: isValidStatus(parsed.status) ? parsed.status : 'passed',
      timestamp: typeof parsed.timestamp === 'string' && parsed.timestamp.trim()
        ? parsed.timestamp
        : new Date().toISOString(),
      findings: findings.length > 0 ? findings : ['External runner completed'],
      recommendations: recommendations.length > 0
        ? recommendations
        : ['Proceed using the returned runner output'],
      metrics: {
        ...metrics,
        executionTimeMs: typeof metrics.executionTimeMs === 'number'
          ? metrics.executionTimeMs
          : elapsedMs,
      },
      nextSkill: typeof parsed.nextSkill === 'string' && parsed.nextSkill.trim()
        ? parsed.nextSkill
        : nextSkill,
    };

    writeRunnerTelemetry(skillName, options, {
      commandTemplate,
      renderedCommand: command,
      status: report.status,
      timestamp: report.timestamp,
      durationMs: elapsedMs,
      exitCode: 0,
      timedOut: 0,
      stdout,
      stderr: '',
      parsedPayload: 1,
    });

    return report;
  } catch (error) {
    const err = error as {
      status?: number;
      signal?: string;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
      killed?: boolean;
    };

    const stderr = err.stderr ? String(err.stderr).trim() : '';
    const stdout = err.stdout ? String(err.stdout).trim() : '';
    const baseMessage = err.message ?? 'External runner failed';
    const detailMessage = [stderr, stdout].find((value) => value.length > 0) ?? baseMessage;

    const failureReport = createRunnerFailureReport(
      skillName,
      detailMessage,
      'none',
      {
        exitCode: typeof err.status === 'number' ? err.status : -1,
        timedOut: err.signal === 'SIGTERM' || err.killed ? 1 : 0,
      },
    );

    writeRunnerTelemetry(skillName, options, {
      commandTemplate: options.runnerCommand ?? '',
      renderedCommand: command,
      status: failureReport.status,
      timestamp: failureReport.timestamp,
      durationMs: Date.now() - startedAt,
      exitCode: typeof err.status === 'number' ? err.status : -1,
      timedOut: err.signal === 'SIGTERM' || err.killed ? 1 : 0,
      stdout,
      stderr,
      parsedPayload: 0,
    });

    return failureReport;
  }
}

export function dispatchSkill(skillName: string, skillsDir: string, options: DispatchOptions = {}): DispatchReport {
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

  const requiresExternalRunner = skillName === 'worker' || skillName === 'fixer';
  if (requiresExternalRunner && !options.runnerCommand) {
    return createRunnerFailureReport(
      skillName,
      'External sub-agent runner is required for worker/fixer',
      'none',
    );
  }

  const usesExternalRunner = Boolean(options.runnerCommand && (skillName === 'worker' || skillName === 'fixer'));
  if (usesExternalRunner) {
    return runExternalRunner(skillName, options);
  }

  const fallbackRecommendations = ['Follow the sub-skill instructions to complete the task'];
  if (skillName === 'worker' || skillName === 'fixer') {
    fallbackRecommendations.push('Configure --runner-command or WORKSPACE_MAXXING_SUBAGENT_RUNNER for true sub-agent execution');
  }

  return {
    skill,
    status: 'passed',
    timestamp: new Date().toISOString(),
    findings: [`Sub-skill "${skill}" loaded successfully`],
    recommendations: fallbackRecommendations,
    metrics: {
      contentLength: content.length,
      simulatedDispatch: skillName === 'worker' || skillName === 'fixer' ? 1 : 0,
    },
    nextSkill: SKILL_NEXT_MAP[skillName] ?? 'none',
  };
}

export function dispatchParallel(
  invocations: ParallelInvocation[],
  skillsDir: string,
  options: ParallelDispatchOptions = {},
): ParallelDispatchResult[] {
  return invocations.map((inv) => {
    const report = dispatchSkill(inv.skill, skillsDir, {
      ...options,
      invocation: inv,
    });
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
  const testCaseId = parseArg('--test-case-id');
  const parallel = args.includes('--parallel');
  const invocationsPath = parseArg('--invocations');
  const runnerCommand = parseArg('--runner-command') ?? process.env.WORKSPACE_MAXXING_SUBAGENT_RUNNER;
  const runnerTimeoutRaw = parseArg('--runner-timeout');
  let runnerTimeoutSeconds: number | undefined;
  if (runnerTimeoutRaw !== undefined) {
    const parsedTimeout = Number(runnerTimeoutRaw);
    if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
      console.error('--runner-timeout must be a positive number of seconds');
      process.exit(1);
    }
    runnerTimeoutSeconds = parsedTimeout;
  }

  const skillsDir = workspace
    ? path.join(workspace, '.agents', 'skills', 'workspace-maxxing', 'skills')
    : path.join(process.cwd(), 'skills');

  const dispatchOptions: ParallelDispatchOptions = {
    workspacePath: workspace,
    runnerCommand,
    runnerTimeoutSeconds,
  };

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

    const results = dispatchParallel(parsed as ParallelInvocation[], skillsDir, dispatchOptions);
    console.log(JSON.stringify(results, null, 2));
  } else {
    if (!skill) {
      console.error('Usage: node dispatch.ts --skill <name> --workspace <path> [--batch-id <n>] [--parallel --invocations <path>]');
      process.exit(1);
    }

    const singleInvocation = batchId
      ? {
        skill,
        batchId: parseInt(batchId, 10),
        testCaseId: testCaseId ?? '',
      }
      : undefined;

    const result = dispatchSkill(skill, skillsDir, {
      ...dispatchOptions,
      invocation: singleInvocation,
    });
    const output = batchId
      ? { ...result, batchId: parseInt(batchId, 10) }
      : result;
    console.log(JSON.stringify(output, null, 2));
  }
}

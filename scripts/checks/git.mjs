import { execFileSync } from 'node:child_process';
import { createPlan, ROOT } from './plan.mjs';

export const planChanges = ({
  full = false,
  staged = false,
  base,
  head = 'HEAD',
  root = ROOT,
} = {}) => {
  if (full) return createPlan([], { full: true, reason: 'explicit full run' });
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    if (!staged && (!base || /^0+$/.test(base)))
      return createPlan([], { full: true, reason: 'comparison base unavailable' });
    const range = staged ? ['--cached'] : [git('merge-base', base, head).trim(), head];
    // --no-renames includes both the old and new paths, including cross-package moves.
    const files = git('diff', '--name-only', '--no-renames', '-z', ...range)
      .split('\0')
      .filter(Boolean);
    const deleted = git('diff', '--name-only', '--no-renames', '--diff-filter=D', '-z', ...range)
      .split('\0')
      .filter(Boolean);
    const plan = createPlan(files);
    // Deleted modules no longer exist in the current import graph.
    plan.tests.forEach((workspace) => {
      if (deleted.some((file) => file.startsWith(`${workspace.directory}/`)))
        workspace.related = null;
    });
    return plan;
  } catch (error) {
    return createPlan([], { full: true, reason: `git comparison unavailable: ${error.message}` });
  }
};

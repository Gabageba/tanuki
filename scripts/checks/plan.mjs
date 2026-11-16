import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');

export const readWorkspaces = (root = ROOT) =>
  ['apps', 'packages'].flatMap((parent) =>
    readdirSync(resolve(root, parent), { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && existsSync(resolve(root, parent, entry.name, 'package.json')),
      )
      .map((entry) => {
        const directory = `${parent}/${entry.name}`;
        const manifest = JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'));
        return {
          name: manifest.name,
          directory,
          scripts: manifest.scripts ?? {},
          dependencies: Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }),
        };
      }),
  );

const isDocumentation = (file) =>
  file.startsWith('docs/') || /\.(md|mdx)$/.test(file) || /(^|\/)(LICENSE|NOTICE)$/.test(file);

const isDevelopmentFile = (file) =>
  /\.(stories|test|spec)\.[cm]?[jt]sx?$/.test(file) ||
  /\/(test|tests|contract|visual|e2e|\.storybook)\//.test(file) ||
  file.startsWith('apps/web/src/shared/storybook/');

const isPlayground = (file) =>
  file.startsWith('apps/web/src/pages/Playground/') ||
  file.startsWith('apps/web/src/app/PlaygroundRouter/');

const isRuntimeFile = (file) =>
  !isDevelopmentFile(file) &&
  !isPlayground(file) &&
  !/(^|\/)(eslint|vitest|nodemon)[^/]*\./.test(file);

export const createPlan = (
  files,
  { full = false, reason = '', workspaces = readWorkspaces() } = {},
) => {
  const changed = [...new Set(files)].filter((file) => !isDocumentation(file));
  const ignored = (file) => /^(\.agents\/|\.claude\/|\.codex\/|\.vscode\/|\.husky\/)/.test(file);
  const selfHostFile = (file) => file.startsWith('scripts/self-host/');
  const e2eFile = (file) => file.startsWith('tests/e2e/');
  const toolingFile = (file) => file.startsWith('scripts/checks/');
  const unknown = changed.find(
    (file) =>
      !ignored(file) &&
      !selfHostFile(file) &&
      !e2eFile(file) &&
      !workspaces.some((workspace) => file.startsWith(`${workspace.directory}/`)),
  );
  // Unknown inputs (including root configs, lockfiles and the selector itself) fail open
  // to a full run, rather than silently losing coverage when the repository grows.
  const runFull = full || !!unknown;
  const direct = new Set(
    workspaces
      .filter((workspace) => changed.some((file) => file.startsWith(`${workspace.directory}/`)))
      .map((workspace) => workspace.name),
  );
  const affected = new Set(runFull ? workspaces.map((workspace) => workspace.name) : direct);
  for (let previousSize = -1; previousSize !== affected.size;) {
    previousSize = affected.size;
    workspaces.forEach((workspace) => {
      if (workspace.dependencies.some((dependency) => affected.has(dependency)))
        affected.add(workspace.name);
    });
  }
  const selected = workspaces.filter((workspace) => affected.has(workspace.name));
  const hasRuntimeChange = changed.some((file) => {
    const owner = workspaces.find((workspace) => file.startsWith(`${workspace.directory}/`));
    return owner && isRuntimeFile(file);
  });
  const tests = selected
    .filter((workspace) => workspace.scripts.test)
    .filter(
      (workspace) =>
        runFull ||
        workspace.name !== '@tanuki/web' ||
        workspace.dependencies.some((dependency) => affected.has(dependency)) ||
        changed.some(
          (file) =>
            file.startsWith('apps/web/') &&
            !isPlayground(file) &&
            (!isDevelopmentFile(file) || file.startsWith('apps/web/test/')),
        ),
    )
    .map((workspace) => {
      const ownFiles = changed.filter((file) => file.startsWith(`${workspace.directory}/`));
      const upstreamChanged = workspace.dependencies.some((dependency) => affected.has(dependency));
      // node:test web suites load modules through Vite at runtime; they cannot be
      // selected by Vitest's static import graph. Keep this small suite together.
      const isVitest = workspace.scripts.test.startsWith('vitest ');
      const related =
        !runFull &&
        !upstreamChanged &&
        isVitest &&
        ownFiles.length > 0 &&
        ownFiles.every(
          (file) =>
            /\.[cm]?[jt]sx?$/.test(file) &&
            (file.startsWith(`${workspace.directory}/src/`) ||
              file.startsWith(`${workspace.directory}/test/`)),
        )
          ? ownFiles.map((file) => file.slice(workspace.directory.length + 1))
          : null;
      return { name: workspace.name, directory: workspace.directory, related };
    });
  const visual =
    runFull ||
    affected.has('@tanuki/contracts') ||
    changed.some(
      (file) =>
        file.startsWith('apps/web/') &&
        !isPlayground(file) &&
        !file.startsWith('apps/web/e2e/') &&
        !file.startsWith('apps/web/test/'),
    );
  return {
    full: runFull,
    reason: reason || (unknown ? `unclassified input: ${unknown}` : 'changed files and consumers'),
    files,
    typecheck: selected.filter((workspace) => workspace.scripts.typecheck).map(({ name }) => name),
    build: selected
      .filter(
        (workspace) =>
          workspace.scripts.build &&
          (runFull ||
            !direct.has(workspace.name) ||
            workspace.dependencies.some((dependency) => affected.has(dependency)) ||
            changed.some(
              (file) => file.startsWith(`${workspace.directory}/`) && isRuntimeFile(file),
            )),
      )
      .map(({ name }) => name),
    tests,
    visual,
    e2e: runFull || hasRuntimeChange || changed.some((file) => e2eFile(file) || selfHostFile(file)),
    selfHost: runFull || changed.some(selfHostFile),
    tooling: runFull || changed.some(toolingFile),
  };
};

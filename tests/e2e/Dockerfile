FROM node:24.20.0-bookworm-slim AS node
FROM mcr.microsoft.com/playwright:v1.64.1-noble
COPY --from=node /usr/local/ /usr/local/
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p /pnpm && corepack enable --install-directory /pnpm
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/parsers/package.json packages/parsers/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/stylelint-config/package.json packages/stylelint-config/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY apps/web/e2e apps/web/e2e
WORKDIR /repo/apps/web
CMD ["pnpm", "exec", "playwright", "test", "-c", "e2e"]

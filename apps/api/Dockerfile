# Node 24 satisfies undici 8 (>=22.19), pnpm 11 and native sharp/argon2.
FROM node:24.20.0-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/parsers/package.json packages/parsers/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/stylelint-config/package.json packages/stylelint-config/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm turbo run build --filter=@tanuki/api

FROM build AS e2e
RUN pnpm --filter @tanuki/api exec tsc -p tsconfig.e2e.json
RUN cp -R apps/api/dist/mail/assets apps/api/dist-e2e/src/mail/assets
WORKDIR /repo/apps/api
CMD ["node", "dist-e2e/test/e2e-main.js"]

FROM build AS package
RUN pnpm --filter @tanuki/api deploy --legacy --prod /out

FROM node:24.20.0-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 LIBSOCIAL_TOKEN_STORE_DIR=/data/libsocial-tokens
WORKDIR /app
COPY --from=package --chown=node:node /out ./
RUN mkdir -p /data/libsocial-tokens && chown -R node:node /data
USER node
EXPOSE 3000 9464
CMD ["node", "dist/main.js"]

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
RUN pnpm turbo run build --filter=@tanuki/web

FROM scratch AS sourcemaps
COPY --from=build /repo/apps/web/dist /web

FROM caddy:2.10.2-alpine AS runtime
RUN apk add --no-cache jq && addgroup -g 1000 tanuki && adduser -D -u 1000 -G tanuki tanuki
COPY --from=build /repo/apps/web/dist /srv
RUN find /srv -name '*.map' -delete && chown -R tanuki:tanuki /srv /data /config
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/web-entrypoint.sh /usr/local/bin/web-entrypoint
USER tanuki
EXPOSE 8080 8443
ENTRYPOINT ["sh", "/usr/local/bin/web-entrypoint"]

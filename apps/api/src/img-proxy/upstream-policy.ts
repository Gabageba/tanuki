import { createUpstreamAgent, isAllowedUpstreamUrl } from './upstream-guard';

export const UPSTREAM_POLICY = Symbol('UPSTREAM_POLICY');
export type UpstreamPolicy = {
  agent: ReturnType<typeof createUpstreamAgent>;
  isAllowedUrl: (url: string) => boolean;
};
export const createUpstreamPolicy = (): UpstreamPolicy => ({
  agent: createUpstreamAgent(),
  isAllowedUrl: isAllowedUpstreamUrl,
});

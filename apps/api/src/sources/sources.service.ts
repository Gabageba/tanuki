import { Inject, Injectable } from '@nestjs/common';
import type { Source } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { SourceHealthService } from '../resilience/source-health.service';

@Injectable()
export class SourcesService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
    private readonly sourceHealth: SourceHealthService,
  ) {}

  async listSources(): Promise<Source[]> {
    const { data } = await this.parsersClient.getSources();
    return data.items
      .filter((source) => this.env.ENABLED_SOURCES.includes(source.id))
      .map((source): Source => ({
        id: source.id,
        title: source.title,
        locale: source.locale,
        status: source.isBroken ? 'down' : this.sourceHealth.getStatus(source.id),
        capabilities: {
          search: source.isSearchSupported,
          tagFilter: source.isMultipleTagsSupported,
          sortOrders: source.sortOrders,
          multipleTags: source.isMultipleTagsSupported,
        },
      }));
  }
}

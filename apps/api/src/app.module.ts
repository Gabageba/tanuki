import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { CatalogModule } from './catalog/catalog.module';
import { EnvModule } from './config/env.module';
import { HealthModule } from './health/health.module';
import { ImgProxyModule } from './img-proxy/img-proxy.module';
import { ResilienceModule } from './resilience/resilience.module';
import { SearchModule } from './search/search.module';
import { SourcesModule } from './sources/sources.module';

@Module({
  imports: [
    EnvModule,
    CacheModule,
    ResilienceModule,
    HealthModule,
    SourcesModule,
    CatalogModule,
    SearchModule,
    ImgProxyModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { EnvModule } from './config/env.module';
import { HealthModule } from './health/health.module';
import { ImgProxyModule } from './img-proxy/img-proxy.module';
import { SourcesModule } from './sources/sources.module';

@Module({
  imports: [EnvModule, HealthModule, SourcesModule, CatalogModule, ImgProxyModule],
})
export class AppModule {}

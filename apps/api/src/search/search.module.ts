import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SourcesModule } from '../sources/sources.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [SourcesModule, CatalogModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

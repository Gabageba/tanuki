import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { MangaController } from './manga.controller';

@Module({
  imports: [ParsersClientModule],
  controllers: [CatalogController, MangaController],
  providers: [CatalogService],
})
export class CatalogModule {}

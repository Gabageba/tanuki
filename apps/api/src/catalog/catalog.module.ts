import { Module } from '@nestjs/common';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { TitleController } from './title.controller';

@Module({
  imports: [ParsersClientModule, AdultContentModule],
  controllers: [CatalogController, TitleController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

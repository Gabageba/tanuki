import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourceAccessModule } from '../source-accounts/source-access.module';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { UserSourcesService } from './user-sources.service';

@Module({
  imports: [ParsersClientModule, SourceAccessModule, AdultContentModule],
  controllers: [SourcesController],
  providers: [SourcesService, UserSourcesService],
  exports: [SourcesService, UserSourcesService],
})
export class SourcesModule {}

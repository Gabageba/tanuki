import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourceAccessModule } from '../source-accounts/source-access.module';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { UserSourcesService } from './user-sources.service';

@Module({
  imports: [ParsersClientModule, SourceAccessModule],
  controllers: [SourcesController],
  providers: [SourcesService, UserSourcesService],
  exports: [SourcesService, UserSourcesService],
})
export class SourcesModule {}

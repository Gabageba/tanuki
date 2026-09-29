import { Module } from '@nestjs/common';
import { SourceAccessModule } from '../source-accounts/source-access.module';
import { ParsersClientService } from './parsers-client.service';
import { parsersProvider, PARSERS } from './parsers.provider';
import { ParsersLifecycleService } from './parsers-lifecycle.service';

export { PARSERS };

@Module({
  imports: [SourceAccessModule],
  providers: [ParsersClientService, parsersProvider, ParsersLifecycleService],
  exports: [ParsersClientService, PARSERS],
})
export class ParsersClientModule {}

import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { SourceProbeController } from './source-probe.controller';
import { SourceProbeService } from './source-probe.service';

@Module({
  imports: [SourcesModule, ParsersClientModule],
  controllers: [SourceProbeController],
  providers: [SourceProbeService],
  exports: [SourceProbeService],
})
export class SourceProbeModule {}

import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';

@Module({
  imports: [SourcesModule, ParsersClientModule],
  controllers: [SelectionsController],
  providers: [SelectionsService],
})
export class SelectionsModule {}

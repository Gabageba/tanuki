import { Module } from '@nestjs/common';
import { ParsersClientService } from './parsers-client.service';

@Module({
  providers: [ParsersClientService],
  exports: [ParsersClientService],
})
export class ParsersClientModule {}

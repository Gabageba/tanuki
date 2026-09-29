import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { SourceAccessModule } from './source-access.module';
import { SourceAccountsController } from './source-accounts.controller';
import { SourceAccountsService } from './source-accounts.service';

@Module({
  imports: [ParsersClientModule, SourceAccessModule, RateLimitModule],
  controllers: [SourceAccountsController],
  providers: [SourceAccountsService],
})
export class SourceAccountsModule {}

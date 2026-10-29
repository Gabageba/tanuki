import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LibSocialLoginService } from './libsocial-login.service';
import { SourceAccessModule } from './source-access.module';
import { SourceAccountsController } from './source-accounts.controller';
import { SourceAccountsService } from './source-accounts.service';

@Module({
  imports: [ParsersClientModule, SourceAccessModule, RateLimitModule],
  controllers: [SourceAccountsController],
  providers: [SourceAccountsService, LibSocialLoginService],
})
export class SourceAccountsModule {}

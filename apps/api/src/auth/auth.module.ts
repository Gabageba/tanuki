import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { InvitesModule } from '../invites/invites.module';
import { MailModule } from '../mail/mail.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { AuthCleanupService } from './auth-cleanup.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

/**
 * AuthGuard регистрируется тут как APP_GUARD — единственное место во всём приложении, где
 * задаётся глобальный guard, чтобы не потерять его среди фич-модулей.
 */
@Module({
  imports: [InvitesModule, MailModule, RateLimitModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    PasswordService,
    AuthCleanupService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [SessionService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

// DatabaseModule и AuthGuard (глобальный APP_GUARD) не импортируются — оба @Global().
@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}

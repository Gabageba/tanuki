import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ManagedUsersController } from './managed-users.controller';
import { ManagedUsersService } from './managed-users.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// DatabaseModule не импортируется: помечен @Global(). AuthModule — ради SessionService: блокировка
// завершает сеансы пользователя.
@Module({
  imports: [AuthModule],
  controllers: [UsersController, ManagedUsersController],
  providers: [UsersService, ManagedUsersService],
})
export class UsersModule {}

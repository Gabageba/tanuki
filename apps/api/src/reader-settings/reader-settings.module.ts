import { Module } from '@nestjs/common';
import { ReaderSettingsController } from './reader-settings.controller';
import { ReaderSettingsService } from './reader-settings.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  controllers: [ReaderSettingsController],
  providers: [ReaderSettingsService],
})
export class ReaderSettingsModule {}

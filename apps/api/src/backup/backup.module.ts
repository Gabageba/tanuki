import { Module } from '@nestjs/common';
import { LibraryModule } from '../library/library.module';
import { TitleLinksModule } from '../matches/title-links.module';
import { BackupController } from './backup.controller';
import { BackupExportService } from './backup-export.service';
import { BackupRestoreService } from './backup-restore.service';

/** Резервная копия: выгрузка библиотеки и настроек файлом и восстановление из него. */
// DatabaseModule, EnvModule и NotificationsModule не импортируются: помечены @Global().
@Module({
  imports: [LibraryModule, TitleLinksModule],
  controllers: [BackupController],
  providers: [BackupExportService, BackupRestoreService],
})
export class BackupModule {}

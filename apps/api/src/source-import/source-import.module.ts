import { Module } from '@nestjs/common';
import { TitleSnapshotsModule } from '../library/title-snapshots.module';
import { LibraryModule } from '../library/library.module';
import { TitleLinksModule } from '../matches/title-links.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourceImportController } from './source-import.controller';
import { SourceImportProgressService } from './source-import-progress.service';
import { SourceImportService } from './source-import.service';

/** Импорт закладок с сайта, где у пользователя есть аккаунт, и фоновая достройка отметок. */
// DatabaseModule, EnvModule и NotificationsModule не импортируются: помечены @Global().
@Module({
  imports: [TitleSnapshotsModule, LibraryModule, TitleLinksModule, ParsersClientModule],
  controllers: [SourceImportController],
  providers: [SourceImportService, SourceImportProgressService],
})
export class SourceImportModule {}

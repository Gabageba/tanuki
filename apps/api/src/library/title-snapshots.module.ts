import { Module } from '@nestjs/common';
import { TitleSnapshotsService } from './title-snapshots.service';

/**
 * Снимки метаданных и глав отдельным модулем: их пишет и CatalogModule (дотяжка со страницы
 * тайтла), а тянуть туда весь LibraryModule с источниками и связями незачем.
 */
// DatabaseModule не импортируется: помечен @Global().
@Module({
  providers: [TitleSnapshotsService],
  exports: [TitleSnapshotsService],
})
export class TitleSnapshotsModule {}

import { Module } from '@nestjs/common';
import { TitleLinksModule } from '../matches/title-links.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { BookmarkFoldersController } from './bookmark-folders.controller';
import { BookmarkFoldersService } from './bookmark-folders.service';
import { BookmarkUpdatesService } from './bookmark-updates.service';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { TitleBookmarkController } from './title-bookmark.controller';
import { TitleSnapshotsModule } from './title-snapshots.module';

/** Закладки и папки, снимки глав и крон новых глав. */
// DatabaseModule и EnvModule не импортируются: помечены @Global().
@Module({
  imports: [TitleLinksModule, TitleSnapshotsModule, SourcesModule, ParsersClientModule],
  controllers: [BookmarkFoldersController, BookmarksController, TitleBookmarkController],
  providers: [BookmarkFoldersService, BookmarksService, BookmarkUpdatesService],
  // Прогресс чтения засчитывает визит, подтверждение связи склеивает закладки.
  exports: [BookmarksService],
})
export class LibraryModule {}

import { Module } from '@nestjs/common';
import { TitleSnapshotsModule } from '../library/title-snapshots.module';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { LibraryModule } from '../library/library.module';
import { TitleLinksModule } from '../matches/title-links.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import {
  ContinueReadingController,
  ReadingProgressController,
} from './reading-progress.controller';
import { ReadingProgressService } from './reading-progress.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  imports: [
    TitleSnapshotsModule,
    TitleLinksModule,
    ParsersClientModule,
    AdultContentModule,
    LibraryModule,
    SourcesModule,
  ],
  controllers: [ReadingProgressController, ContinueReadingController],
  providers: [ReadingProgressService],
})
export class ReadingProgressModule {}

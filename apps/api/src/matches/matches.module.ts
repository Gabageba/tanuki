import { Module } from '@nestjs/common';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { LibraryModule } from '../library/library.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { MatchesController } from './matches.controller';
import { TitleLinksModule } from './title-links.module';
import { MatchesService } from './matches.service';

// CacheModule, EnvModule и DatabaseModule не импортируются: все помечены @Global().
@Module({
  imports: [
    SourcesModule,
    ParsersClientModule,
    AdultContentModule,
    TitleLinksModule,
    LibraryModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}

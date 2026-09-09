import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { MatchesController } from './matches.controller';
import { MangaLinksService } from './manga-links.service';
import { MatchesService } from './matches.service';

// CacheModule, EnvModule и DatabaseModule не импортируются: все помечены @Global().
@Module({
  imports: [SourcesModule, ParsersClientModule],
  controllers: [MatchesController],
  providers: [MatchesService, MangaLinksService],
})
export class MatchesModule {}

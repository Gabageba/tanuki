import { Module } from '@nestjs/common';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { SourcesModule } from '../sources/sources.module';
import { MatchesController } from './matches.controller';
import { TitleLinksService } from './title-links.service';
import { MatchesService } from './matches.service';

// CacheModule, EnvModule и DatabaseModule не импортируются: все помечены @Global().
@Module({
  imports: [SourcesModule, ParsersClientModule, AdultContentModule],
  controllers: [MatchesController],
  providers: [MatchesService, TitleLinksService],
  // Прогресс чтения делит с матчингом одно понятие «тот же тайтл» — группу подтверждений.
  exports: [TitleLinksService],
})
export class MatchesModule {}

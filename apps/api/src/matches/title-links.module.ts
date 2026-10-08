import { Module } from '@nestjs/common';
import { TitleLinksService } from './title-links.service';

/**
 * Связи тайтлов — отдельным модулем: понятие «тот же тайтл» нужно и матчингу, и прогрессу, и
 * закладкам, а закладки, в свою очередь, нужны матчингу (подтверждение связи склеивает их).
 * Живи сервис в MatchesModule, MatchesModule и LibraryModule импортировали бы друг друга.
 */
// DatabaseModule не импортируется: помечен @Global().
@Module({
  providers: [TitleLinksService],
  exports: [TitleLinksService],
})
export class TitleLinksModule {}

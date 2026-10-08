import { Module } from '@nestjs/common';
import { TitleLinksModule } from '../matches/title-links.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { ReadingStatisticsController } from './reading-statistics.controller';
import { ReadingStatisticsService } from './reading-statistics.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  imports: [TitleLinksModule, ParsersClientModule],
  controllers: [ReadingStatisticsController],
  providers: [ReadingStatisticsService],
})
export class ReadingStatisticsModule {}

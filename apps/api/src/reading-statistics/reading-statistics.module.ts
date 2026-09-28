import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { ReadingStatisticsController } from './reading-statistics.controller';
import { ReadingStatisticsService } from './reading-statistics.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  imports: [MatchesModule, ParsersClientModule],
  controllers: [ReadingStatisticsController],
  providers: [ReadingStatisticsService],
})
export class ReadingStatisticsModule {}

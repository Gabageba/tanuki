import { Module } from '@nestjs/common';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { MatchesModule } from '../matches/matches.module';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { ReadingProgressController } from './reading-progress.controller';
import { ReadingProgressService } from './reading-progress.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  imports: [MatchesModule, ParsersClientModule, AdultContentModule],
  controllers: [ReadingProgressController],
  providers: [ReadingProgressService],
})
export class ReadingProgressModule {}

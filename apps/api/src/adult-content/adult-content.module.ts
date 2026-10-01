import { Module } from '@nestjs/common';
import { AdultContentService } from './adult-content.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  providers: [AdultContentService],
  exports: [AdultContentService],
})
export class AdultContentModule {}

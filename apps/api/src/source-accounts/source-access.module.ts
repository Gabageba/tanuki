import { Module } from '@nestjs/common';
import { AdultContentModule } from '../adult-content/adult-content.module';
import { SourceAccessService } from './source-access.service';

/**
 * Отдельно от SourceAccountsModule: SourceAccessService нужен ParsersClientService, а привязке
 * аккаунтов нужен реестр парсеров из ParsersClientModule — в одном модуле это был бы цикл.
 */
@Module({
  imports: [AdultContentModule],
  providers: [SourceAccessService],
  exports: [SourceAccessService],
})
export class SourceAccessModule {}

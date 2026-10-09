import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';
import { EnvModule } from './config/env.module';
import { HealthModule } from './health/health.module';
import { ImgProxyModule } from './img-proxy/img-proxy.module';
import { InvitesModule } from './invites/invites.module';
import { LibraryModule } from './library/library.module';
import { MatchesModule } from './matches/matches.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReaderSettingsModule } from './reader-settings/reader-settings.module';
import { ReadingProgressModule } from './reading-progress/reading-progress.module';
import { ReadingStatisticsModule } from './reading-statistics/reading-statistics.module';
import { ResilienceModule } from './resilience/resilience.module';
import { SearchModule } from './search/search.module';
import { SourceProbeModule } from './source-probe/source-probe.module';
import { SourcesModule } from './sources/sources.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { UsersModule } from './users/users.module';
import { SourceAccountsModule } from './source-accounts/source-accounts.module';
import { ViewerContextInterceptor } from './source-accounts/viewer-context.interceptor';

@Module({
  imports: [
    EnvModule,
    ScheduleModule.forRoot(),
    CacheModule,
    DatabaseModule,
    ResilienceModule,
    // AuthModule первым среди фичевых модулей — он регистрирует глобальный AuthGuard.
    AuthModule,
    InvitesModule,
    HealthModule,
    SourcesModule,
    SourceProbeModule,
    CatalogModule,
    SearchModule,
    MatchesModule,
    ImgProxyModule,
    ReaderSettingsModule,
    ReadingProgressModule,
    ReadingStatisticsModule,
    LibraryModule,
    NotificationsModule,
    UserSettingsModule,
    UsersModule,
    SourceAccountsModule,
  ],
  providers: [
    // Зритель запроса — в AsyncLocalStorage: по нему ParsersClientService решает, от чьего
    // аккаунта идти к источнику. Интерсептор выполняется после AuthGuard.
    { provide: APP_INTERCEPTOR, useClass: ViewerContextInterceptor },
    // До сих пор ни одно тело запроса не валидировалось на входе — DTO объявляли форму, но
    // ничего её не проверяло. Auth — первый модуль, которому это действительно важно.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}

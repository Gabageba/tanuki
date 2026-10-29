import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  SourceAuthFamilySchema,
  type LibSocialLoginStep,
  type SourceAccountsResponse,
} from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BadRequestApiException } from '../common/errors';
import { RATE_LIMIT } from '../rate-limit/models';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { LibSocialLoginService } from './libsocial-login.service';
import {
  ConfirmLibSocialLoginRequestDto,
  LibSocialLoginStepDto,
  LinkLibSocialTokenRequestDto,
  LinkSourceAccountRequestDto,
  LinkSourceSessionRequestDto,
  SourceAccountsResponseDto,
} from './source-accounts.dto';
import { SourceAccountsService } from './source-accounts.service';

const parseFamily = (value: string) => {
  const parsed = SourceAuthFamilySchema.safeParse(value);
  if (!parsed.success) throw new BadRequestApiException();
  return parsed.data;
};

@ApiTags('source-accounts')
@Controller('source-accounts')
export class SourceAccountsController {
  constructor(
    private readonly sourceAccounts: SourceAccountsService,
    private readonly libSocialLogin: LibSocialLoginService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @ApiOperation({ summary: 'Привязанные аккаунты источников текущего пользователя' })
  @ApiOkResponse({ type: SourceAccountsResponseDto })
  @Get()
  async list(@CurrentUser() user: SessionUser): Promise<SourceAccountsResponse> {
    return this.sourceAccounts.list(user.id);
  }

  @ApiOperation({ summary: 'Входит в Grouple или AllHentai логином и паролем' })
  @ApiParam({ name: 'family' })
  @ApiBody({ type: LinkSourceAccountRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':family/login')
  async login(
    @CurrentUser() user: SessionUser,
    @Param('family') family: string,
    @Body() body: LinkSourceAccountRequestDto,
  ): Promise<void> {
    // Много входов с одного IP сервера — риск капчи или бана на шлюзе источника.
    await this.rateLimit.consume(
      `source-login:${user.id}:${family}`,
      RATE_LIMIT.SOURCE_LOGIN.limit,
      RATE_LIMIT.SOURCE_LOGIN.windowSeconds,
    );
    await this.sourceAccounts.linkWithPassword(user.id, parseFamily(family), body);
  }

  @ApiOperation({
    summary: 'Привязывает аккаунт сети inuko (Inkstory, PureManga) cookie сессии из браузера',
  })
  @ApiParam({ name: 'family' })
  @ApiBody({ type: LinkSourceSessionRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':family/session')
  async linkSession(
    @CurrentUser() user: SessionUser,
    @Param('family') family: string,
    @Body() body: LinkSourceSessionRequestDto,
  ): Promise<void> {
    await this.rateLimit.consume(
      `source-login:${user.id}:${family}`,
      RATE_LIMIT.SOURCE_LOGIN.limit,
      RATE_LIMIT.SOURCE_LOGIN.windowSeconds,
    );
    await this.sourceAccounts.linkSession(user.id, parseFamily(family), body.value);
  }

  @ApiOperation({
    summary:
      'Входит в LibSocial логином и паролем — сервер сам проходит форму входа сайтов сети по очереди',
  })
  @ApiBody({ type: LinkSourceAccountRequestDto })
  @ApiOkResponse({ type: LibSocialLoginStepDto })
  @HttpCode(HttpStatus.OK)
  @Post('libsocial/login')
  async loginLibSocial(
    @CurrentUser() user: SessionUser,
    @Body() body: LinkSourceAccountRequestDto,
  ): Promise<LibSocialLoginStep> {
    await this.rateLimit.consume(
      `source-login:${user.id}:libsocial`,
      RATE_LIMIT.SOURCE_LOGIN.limit,
      RATE_LIMIT.SOURCE_LOGIN.windowSeconds,
    );
    return this.libSocialLogin.start(user.id, body);
  }

  @ApiOperation({ summary: 'Отправляет код из письма сайту LibSocial, который ждёт его' })
  @ApiBody({ type: ConfirmLibSocialLoginRequestDto })
  @ApiOkResponse({ type: LibSocialLoginStepDto })
  @HttpCode(HttpStatus.OK)
  @Post('libsocial/login/code')
  async confirmLibSocialLogin(
    @CurrentUser() user: SessionUser,
    @Body() body: ConfirmLibSocialLoginRequestDto,
  ): Promise<LibSocialLoginStep> {
    // Код короткий — перебирать его с нашего сервера не дадим.
    await this.rateLimit.consume(
      `source-login-code:${user.id}:libsocial`,
      RATE_LIMIT.SOURCE_LOGIN.limit,
      RATE_LIMIT.SOURCE_LOGIN.windowSeconds,
    );
    return this.libSocialLogin.confirm(user.id, body.code);
  }

  @ApiOperation({ summary: 'Пропускает сайт LibSocial, ждущий код, и входит в следующий' })
  @ApiOkResponse({ type: LibSocialLoginStepDto })
  @HttpCode(HttpStatus.OK)
  @Post('libsocial/login/skip')
  async skipLibSocialLogin(@CurrentUser() user: SessionUser): Promise<LibSocialLoginStep> {
    return this.libSocialLogin.skip(user.id);
  }

  @ApiOperation({ summary: 'Добавляет к аккаунту LibSocial токен сайта из его localStorage' })
  @ApiBody({ type: LinkLibSocialTokenRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('libsocial/token')
  async linkLibSocial(
    @CurrentUser() user: SessionUser,
    @Body() body: LinkLibSocialTokenRequestDto,
  ): Promise<void> {
    await this.rateLimit.consume(
      `source-login:${user.id}:libsocial`,
      RATE_LIMIT.SOURCE_LOGIN.limit,
      RATE_LIMIT.SOURCE_LOGIN.windowSeconds,
    );
    await this.sourceAccounts.linkLibSocialToken(user.id, body.sourceId, body.value);
  }

  @ApiOperation({ summary: 'Отвязывает аккаунт — источник снова закрывается' })
  @ApiParam({ name: 'family' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':family')
  async unlink(@CurrentUser() user: SessionUser, @Param('family') family: string): Promise<void> {
    await this.sourceAccounts.unlink(user.id, parseFamily(family));
  }
}

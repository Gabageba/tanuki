import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CurrentUser, SessionsResponse } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { RATE_LIMIT } from '../rate-limit/models';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import {
  ChangeEmailRequestDto,
  ChangePasswordRequestDto,
  ConfirmEmailChangeRequestDto,
  DeleteAccountRequestDto,
  SessionsResponseDto,
} from './account.dto';
import { AccountService } from './account.service';
import { CurrentUserDto, VerifyEmailRequestDto } from './auth.dto';
import { clearSessionCookie, setSessionCookie } from './cookie.util';
import { CurrentSession } from './current-session.decorator';
import { CurrentUser as CurrentUserParam } from './current-user.decorator';
import { Public } from './public.decorator';
import { SessionService, type SessionRow, type SessionUser } from './session.service';
import { toSession } from './session.util';

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly sessionService: SessionService,
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @ApiOperation({ summary: 'Запрашивает смену почты — на новый адрес уходит код подтверждения' })
  @ApiBody({ type: ChangeEmailRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('email')
  async changeEmail(
    @CurrentUserParam() user: SessionUser,
    @Body() body: ChangeEmailRequestDto,
  ): Promise<void> {
    await this.consumePasswordLimit(user.id);
    await this.accountService.requestEmailChange(user, body.newEmail, body.password);
  }

  @ApiOperation({
    summary: 'Применяет смену почты по коду из письма, на прежний адрес уходит уведомление',
  })
  @ApiBody({ type: ConfirmEmailChangeRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Post('email/confirm')
  async confirmEmailChange(
    @CurrentUserParam() user: SessionUser,
    @Body() body: ConfirmEmailChangeRequestDto,
  ): Promise<CurrentUser> {
    return this.accountService.confirmEmailChange(user, body.code);
  }

  @ApiOperation({
    summary: '«Это был не я»: возвращает прежнюю почту и завершает все сеансы',
  })
  @ApiBody({ type: VerifyEmailRequestDto })
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('email/revert')
  async revertEmailChange(
    @Body() body: VerifyEmailRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.accountService.revertEmailChange(body.token);
    // Все сеансы уже отозваны — если ссылку открыли в залогиненном браузере, cookie тоже мёртвая.
    if (request.user) clearSessionCookie(reply, this.env.COOKIE_SECURE);
  }

  @ApiOperation({ summary: 'Меняет пароль, по желанию завершая остальные сеансы' })
  @ApiBody({ type: ChangePasswordRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password')
  async changePassword(
    @CurrentUserParam() user: SessionUser,
    @CurrentSession() session: SessionRow,
    @Body() body: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.consumePasswordLimit(user.id);
    await this.accountService.changePassword(
      user,
      session.id,
      body.currentPassword,
      body.newPassword,
      body.signOutOtherDevices,
    );
  }

  @ApiOperation({ summary: 'Активные сеансы текущего аккаунта' })
  @ApiOkResponse({ type: SessionsResponseDto })
  @Get('sessions')
  async sessions(
    @CurrentUserParam() user: SessionUser,
    @CurrentSession() session: SessionRow,
  ): Promise<SessionsResponse> {
    const rows = await this.sessionService.listForUser(user.id);
    return { items: rows.map((row) => toSession(row, session.id)) };
  }

  @ApiOperation({ summary: 'Завершает один сеанс' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUserParam() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.sessionService.revokeById(user.id, id);
  }

  @ApiOperation({ summary: 'Завершает все сеансы, кроме текущего' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('sessions')
  async revokeOtherSessions(
    @CurrentUserParam() user: SessionUser,
    @CurrentSession() session: SessionRow,
  ): Promise<void> {
    await this.sessionService.revokeAllExcept(user.id, session.id);
  }

  @ApiOperation({ summary: 'Планирует удаление аккаунта через 14 дней и завершает все сеансы' })
  @ApiBody({ type: DeleteAccountRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('deletion')
  async scheduleDeletion(
    @CurrentUserParam() user: SessionUser,
    @Body() body: DeleteAccountRequestDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.consumePasswordLimit(user.id);
    await this.accountService.scheduleDeletion(user, body.password);
    clearSessionCookie(reply, this.env.COOKIE_SECURE);
  }

  @ApiOperation({ summary: 'Отменяет удаление по ссылке из письма и сразу логинит' })
  @ApiBody({ type: VerifyEmailRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Public()
  @Post('deletion/cancel')
  async cancelDeletion(
    @Body() body: VerifyEmailRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<CurrentUser> {
    const result = await this.accountService.cancelDeletion(body.token, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });
    setSessionCookie(reply, result.token, {
      remember: result.remember,
      secure: this.env.COOKIE_SECURE,
    });
    return result.user;
  }

  /** Подбор текущего пароля через эти эндпоинты ограничен так же, как через вход. */
  private async consumePasswordLimit(userId: string): Promise<void> {
    await this.rateLimit.consume(
      `account-password:${userId}`,
      RATE_LIMIT.ACCOUNT_PASSWORD.limit,
      RATE_LIMIT.ACCOUNT_PASSWORD.windowSeconds,
    );
  }
}

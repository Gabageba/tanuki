import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CheckUsernameResponse, CurrentUser, InviteCheckResponse } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { InvitesService } from '../invites/invites.service';
import { RATE_LIMIT } from '../rate-limit/models';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { toCurrentUser } from '../users/users.util';
import { AuthService, type AuthResult } from './auth.service';
import {
  CheckUsernameResponseDto,
  CurrentUserDto,
  ForgotPasswordRequestDto,
  InviteCheckResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendVerificationRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
} from './auth.dto';
import { clearSessionCookie, setSessionCookie } from './cookie.util';
import { CurrentUser as CurrentUserParam } from './current-user.decorator';
import { SESSION_COOKIE_NAME } from './models';
import { Public } from './public.decorator';
import type { SessionUser } from './session.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly invitesService: InvitesService,
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @ApiOperation({ summary: 'Проверяет, что инвайт ещё можно использовать' })
  @ApiParam({ name: 'code' })
  @ApiOkResponse({ type: InviteCheckResponseDto })
  @Public()
  @Get('invites/:code')
  async checkInvite(@Param('code') code: string): Promise<InviteCheckResponse> {
    return { valid: await this.invitesService.isValid(code) };
  }

  @ApiOperation({ summary: 'Проверяет, свободно ли имя пользователя' })
  @ApiOkResponse({ type: CheckUsernameResponseDto })
  @Public()
  @Get('check-username')
  async checkUsername(
    @Query('username') username: string,
    @Query('invite') invite: string,
    @Req() request: FastifyRequest,
  ): Promise<CheckUsernameResponse> {
    await this.rateLimit.consume(
      `check-username:${request.ip}`,
      RATE_LIMIT.CHECK_USERNAME.limit,
      RATE_LIMIT.CHECK_USERNAME.windowSeconds,
    );
    if (!(await this.invitesService.isValid(invite))) {
      return { available: false };
    }
    return { available: await this.authService.isUsernameAvailable(username) };
  }

  @ApiOperation({ summary: 'Регистрация по инвайту — почту ещё нужно подтвердить' })
  @ApiBody({ type: RegisterRequestDto })
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('register')
  async register(@Body() body: RegisterRequestDto, @Req() request: FastifyRequest): Promise<void> {
    await this.rateLimit.consume(
      `register:${request.ip}`,
      RATE_LIMIT.REGISTER.limit,
      RATE_LIMIT.REGISTER.windowSeconds,
    );
    await this.authService.register(body);
  }

  @ApiOperation({ summary: 'Подтверждает почту по ссылке из письма и сразу логинит' })
  @ApiBody({ type: VerifyEmailRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Public()
  @Post('verify-email')
  async verifyEmail(
    @Body() body: VerifyEmailRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<CurrentUser> {
    const result = await this.authService.verifyEmail(body.token, this.metaOf(request));
    this.applySession(reply, result);
    return result.user;
  }

  @ApiOperation({ summary: 'Повторная отправка письма подтверждения' })
  @ApiBody({ type: ResendVerificationRequestDto })
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationRequestDto): Promise<void> {
    await this.rateLimit.consume(
      `email-short:${body.email}`,
      RATE_LIMIT.EMAIL_SHORT.limit,
      RATE_LIMIT.EMAIL_SHORT.windowSeconds,
    );
    await this.rateLimit.consume(
      `email-hourly:${body.email}`,
      RATE_LIMIT.EMAIL_HOURLY.limit,
      RATE_LIMIT.EMAIL_HOURLY.windowSeconds,
    );
    await this.authService.resendVerification(body.email, body.language);
  }

  @ApiOperation({ summary: 'Вход по почте или имени пользователя' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Public()
  @Post('login')
  async login(
    @Body() body: LoginRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<CurrentUser> {
    await this.rateLimit.consume(
      `login:${request.ip}:${body.login.toLowerCase()}`,
      RATE_LIMIT.LOGIN.limit,
      RATE_LIMIT.LOGIN.windowSeconds,
    );
    const result = await this.authService.login(
      body.login,
      body.password,
      body.remember,
      this.metaOf(request),
    );
    this.applySession(reply, result);
    return result.user;
  }

  @ApiOperation({ summary: 'Текущий пользователь' })
  @ApiOkResponse({ type: CurrentUserDto })
  @Get('me')
  me(@CurrentUserParam() user: SessionUser): CurrentUser {
    return toCurrentUser(user);
  }

  @ApiOperation({ summary: 'Выход — отзывает текущую сессию' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const token = request.cookies[SESSION_COOKIE_NAME] as string | undefined;
    if (token) await this.authService.logout(token);
    clearSessionCookie(reply, this.env.COOKIE_SECURE);
  }

  @ApiOperation({
    summary: 'Запрашивает письмо для сброса пароля — ответ не выдаёт, есть ли аккаунт',
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordRequestDto): Promise<void> {
    await this.rateLimit.consume(
      `email-short:${body.email}`,
      RATE_LIMIT.EMAIL_SHORT.limit,
      RATE_LIMIT.EMAIL_SHORT.windowSeconds,
    );
    await this.rateLimit.consume(
      `email-hourly:${body.email}`,
      RATE_LIMIT.EMAIL_HOURLY.limit,
      RATE_LIMIT.EMAIL_HOURLY.windowSeconds,
    );
    await this.authService.forgotPassword(body.email, body.language);
  }

  @ApiOperation({ summary: 'Задаёт новый пароль по ссылке из письма, отзывает старые сессии' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<CurrentUser> {
    const result = await this.authService.resetPassword(
      body.token,
      body.password,
      this.metaOf(request),
    );
    this.applySession(reply, result);
    return result.user;
  }

  private metaOf(request: FastifyRequest) {
    return { userAgent: request.headers['user-agent'], ip: request.ip };
  }

  private applySession(reply: FastifyReply, result: AuthResult) {
    setSessionCookie(reply, result.token, {
      remember: result.remember,
      secure: this.env.COOKIE_SECURE,
    });
  }
}

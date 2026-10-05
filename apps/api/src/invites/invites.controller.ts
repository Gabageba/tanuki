import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  USER_ROLE,
  type CreateInviteResponse,
  type Invite,
  type InvitesResponse,
} from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { SessionUser } from '../auth/session.service';
import {
  CreateInviteRequestDto,
  CreateInviteResponseDto,
  InviteDto,
  InvitesQueryDto,
  InvitesResponseDto,
} from './invites.dto';
import { InvitesService } from './invites.service';

/** Всё под @Roles(ADMIN, MODERATOR) — обычный пользователь эти эндпоинты не видит (403). Внутри
 *  модератор выпускает только инвайты роли USER, а отзывает и перевыпускает только свои (см.
 *  InvitesService). */
@ApiTags('invites')
@Roles(USER_ROLE.ADMIN, USER_ROLE.MODERATOR)
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @ApiOperation({ summary: 'Приглашения постранично — с фильтрами по статусу и роли' })
  @ApiOkResponse({ type: InvitesResponseDto })
  @Get()
  async list(@Query() query: InvitesQueryDto): Promise<InvitesResponse> {
    return this.invitesService.list(query);
  }

  @ApiOperation({ summary: 'Создаёт приглашение — код виден только в этом ответе' })
  @ApiBody({ type: CreateInviteRequestDto })
  @ApiOkResponse({ type: CreateInviteResponseDto })
  @Post()
  async create(
    @Body() body: CreateInviteRequestDto,
    @CurrentUser() actor: SessionUser,
  ): Promise<CreateInviteResponse> {
    return this.invitesService.create(body.role, actor);
  }

  @ApiOperation({ summary: 'Отзывает активное приглашение — модератор только своё' })
  @ApiOkResponse({ type: InviteDto })
  @Delete(':id')
  async revoke(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Invite> {
    return this.invitesService.revoke(actor, id);
  }

  @ApiOperation({
    summary:
      'Отзывает активное приглашение и выпускает новое с той же ролью — код виден только тут',
  })
  @ApiOkResponse({ type: CreateInviteResponseDto })
  @Post(':id/reissue')
  async reissue(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CreateInviteResponse> {
    return this.invitesService.reissue(actor, id);
  }
}

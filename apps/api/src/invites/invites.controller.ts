import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
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
import { CreateInviteRequestDto, CreateInviteResponseDto, InvitesResponseDto } from './invites.dto';
import { InvitesService } from './invites.service';

/** Всё под @Roles(ADMIN, MODERATOR) — обычный пользователь эти эндпоинты не видит (403). Внутри
 *  create() модератору дополнительно запрещено выпускать инвайт роли MODERATOR — это может
 *  только админ (см. InvitesService.create). */
@ApiTags('invites')
@Roles(USER_ROLE.ADMIN, USER_ROLE.MODERATOR)
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @ApiOperation({ summary: 'Список приглашений' })
  @ApiOkResponse({ type: InvitesResponseDto })
  @Get()
  async list(): Promise<InvitesResponse> {
    const items: Invite[] = await this.invitesService.list();
    return { items };
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

  @ApiOperation({ summary: 'Отзывает ещё не использованное приглашение' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async revoke(@Param('id') id: string): Promise<void> {
    await this.invitesService.revoke(id);
  }
}

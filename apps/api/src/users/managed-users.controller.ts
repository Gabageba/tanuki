import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLE, type ManagedUser, type ManagedUsersResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { SessionUser } from '../auth/session.service';
import {
  BlockUserRequestDto,
  ChangeUserRoleRequestDto,
  ManagedUserDto,
  ManagedUsersQueryDto,
  ManagedUsersResponseDto,
} from './users.dto';
import { ManagedUsersService } from './managed-users.service';

/** «Управление» → «Пользователи». Весь контроллер — только персоналу; что именно можно сделать с
 *  конкретным аккаунтом, решает ManagedUsersService (403, если нельзя). */
@ApiTags('users')
@Roles(USER_ROLE.ADMIN, USER_ROLE.MODERATOR)
@Controller('users')
export class ManagedUsersController {
  constructor(private readonly managedUsersService: ManagedUsersService) {}

  @ApiOperation({ summary: 'Пользователи постранично — с поиском по имени и почте и фильтрами' })
  @ApiOkResponse({ type: ManagedUsersResponseDto })
  @Get()
  async list(@Query() query: ManagedUsersQueryDto): Promise<ManagedUsersResponse> {
    return this.managedUsersService.list(query);
  }

  @ApiOperation({ summary: 'Назначает или снимает модератора — только админ' })
  @ApiBody({ type: ChangeUserRoleRequestDto })
  @ApiOkResponse({ type: ManagedUserDto })
  @Patch(':id/role')
  async changeRole(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeUserRoleRequestDto,
  ): Promise<ManagedUser> {
    return this.managedUsersService.changeRole(actor, id, body.role);
  }

  @ApiOperation({ summary: 'Блокирует на срок или навсегда и завершает все сеансы' })
  @ApiBody({ type: BlockUserRequestDto })
  @ApiOkResponse({ type: ManagedUserDto })
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  async block(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BlockUserRequestDto,
  ): Promise<ManagedUser> {
    return this.managedUsersService.block(actor, id, body);
  }

  @ApiOperation({ summary: 'Снимает блокировку' })
  @ApiOkResponse({ type: ManagedUserDto })
  @Delete(':id/block')
  async unblock(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ManagedUser> {
    return this.managedUsersService.unblock(actor, id);
  }

  @ApiOperation({ summary: 'Удаляет аккаунт сразу, без отсрочки — только админ' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.managedUsersService.delete(actor, id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import type { CurrentUser } from '@tanuki/contracts';
import { CurrentUserDto } from '../auth/auth.dto';
import { CurrentUser as CurrentUserParam } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { SessionUser } from '../auth/session.service';
import { InvalidImageException, NotFoundApiException } from '../common/errors';
import { UpdateProfileRequestDto } from './users.dto';
import { UsersService } from './users.service';
import { toCurrentUser } from './users.util';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Меняет имя пользователя текущего аккаунта' })
  @ApiBody({ type: UpdateProfileRequestDto })
  @ApiOkResponse({ type: CurrentUserDto })
  @Patch('me')
  async updateProfile(
    @CurrentUserParam() user: SessionUser,
    @Body() body: UpdateProfileRequestDto,
  ): Promise<CurrentUser> {
    return toCurrentUser(await this.usersService.updateUsername(user.id, body.username));
  }

  @ApiOperation({
    summary: 'Загружает аватар — тело запроса это сама картинка, сервер ужимает её до webp',
  })
  @ApiConsumes('image/*')
  @ApiOkResponse({ type: CurrentUserDto })
  @Put('me/avatar')
  async updateAvatar(
    @CurrentUserParam() user: SessionUser,
    @Body() body: unknown,
  ): Promise<CurrentUser> {
    // Buffer приходит только при Content-Type image/* — см. парсер в main.ts
    if (!Buffer.isBuffer(body)) throw new InvalidImageException();
    return toCurrentUser(await this.usersService.updateAvatar(user.id, body));
  }

  @ApiOperation({ summary: 'Удаляет аватар — вместо него снова показываются инициалы' })
  @ApiOkResponse({ type: CurrentUserDto })
  @Delete('me/avatar')
  async deleteAvatar(@CurrentUserParam() user: SessionUser): Promise<CurrentUser> {
    return toCurrentUser(await this.usersService.deleteAvatar(user.id));
  }

  @ApiOperation({ summary: 'Аватар пользователя в webp' })
  @ApiParam({ name: 'id' })
  @ApiProduces('image/webp')
  @Public()
  @Get(':id/avatar')
  async getAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const avatar = await this.usersService.getAvatar(id);
    if (!avatar) throw new NotFoundApiException();
    // Ссылка несёт версию (toCurrentUser), так что по одному адресу байты никогда не меняются
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    reply.header('Content-Type', 'image/webp');
    reply.status(HttpStatus.OK).send(avatar);
  }
}

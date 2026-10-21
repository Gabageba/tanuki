import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { USER_ROLE, type CurrentUser, type UserRole } from '@tanuki/contracts';
import { CURRENT_USER } from '@/shared/storybook/fixtures';
import { apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import MobileMenuButton from './MobileMenuButton';
import { MOBILE_GLOBALS, STORY_FOOTER } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Навигация/MobileMenuButton',
  globals: MOBILE_GLOBALS,
  // Кнопка и есть часть нижней панели — вторая её копия под историей не нужна.
  parameters: { footer: STORY_FOOTER.SPACE },
  render: () => (
    <ModalStage>
      {({ opened, setOpened }) => (
        <MobileMenuButton isActive={false} isOpened={opened} setIsOpened={setOpened} />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

/** Ответ `/auth/me` с другой ролью — от неё зависят бейдж в заголовке и пункт «Управление». */
const currentUserHandler = (role: UserRole) =>
  http.get(apiPath('/auth/me'), () =>
    HttpResponse.json({ ...CURRENT_USER, role } satisfies CurrentUser),
  );

export const Admin: Story = {
  name: 'Администратор',
};

export const Moderator: Story = {
  name: 'Модератор',
  parameters: {
    msw: [currentUserHandler(USER_ROLE.MODERATOR)],
  },
};

export const User: Story = {
  name: 'Пользователь',
  parameters: {
    msw: [currentUserHandler(USER_ROLE.USER)],
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES_RESPONSE } from '@/shared/storybook/fixtures';
import { apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import MobileSourceSelect from './MobileSourceSelect';
import { MOBILE_GLOBALS, STORY_FOOTER } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Навигация/MobileSourceSelect',
  globals: MOBILE_GLOBALS,
  // Кнопка и есть часть нижней панели — вторая её копия под историей не нужна.
  parameters: { footer: STORY_FOOTER.SPACE },
  render: () => (
    <ModalStage>
      {({ opened, setOpened }) => (
        <MobileSourceSelect isActive isOpened={opened} setIsOpened={setOpened} />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Выбор источника',
};

/** Ответ `/sources`, где пользователь выключил все источники. */
const DISABLED_SOURCES_RESPONSE = Object.fromEntries(
  Object.entries(SOURCES_RESPONSE).map(([contentType, sources]) => [
    contentType,
    sources.map((source) => ({ ...source, isEnabled: false })),
  ]),
);

export const NoSources: Story = {
  name: 'Нет источников',
  parameters: {
    msw: [http.get(apiPath('/sources'), () => HttpResponse.json(DISABLED_SOURCES_RESPONSE))],
  },
};

export const NothingFound: Story = {
  name: 'Поиск ничего не нашёл',
  play: async () =>
    userEvent.type(await screen.findByPlaceholderText(I18N.t('findSource')), 'несуществующий'),
};

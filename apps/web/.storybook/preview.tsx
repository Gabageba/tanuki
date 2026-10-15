import '@/app/Providers/styles';
import type { Preview } from '@storybook/react-vite';
import { setupWorker } from 'msw/browser';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { COLOR_SCHEME, LANGUAGE, type ColorScheme, type Language } from '@tanuki/contracts';
import { DEFAULT_HANDLERS } from '@/shared/storybook/handlers';
import StoryProviders from './StoryProviders';

type Globals = {
  language: Language;
  colorScheme: ColorScheme;
};

const preview: Preview = {
  // Ответы по умолчанию — начальные обработчики воркера: они переживают сброс между историями,
  // а `parameters.msw` истории встают перед ними.
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker(...DEFAULT_HANDLERS);
      await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
      return worker;
    }),
  ],
  globalTypes: {
    language: {
      description: 'Язык интерфейса',
      toolbar: {
        title: 'Язык',
        icon: 'globe',
        items: [
          { value: LANGUAGE.RU, title: 'Русский' },
          { value: LANGUAGE.EN, title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
    colorScheme: {
      description: 'Цветовая схема',
      toolbar: {
        title: 'Тема',
        icon: 'mirror',
        items: [
          { value: COLOR_SCHEME.DARK, title: 'Тёмная', icon: 'moon' },
          { value: COLOR_SCHEME.LIGHT, title: 'Светлая', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    language: LANGUAGE.RU,
    colorScheme: COLOR_SCHEME.DARK,
  },
  parameters: {
    // Фон даёт тема Mantine, свой фон Storybook его бы перекрыл.
    backgrounds: { disable: true },
    // Без отступа Storybook: с ним сдвигаются оверлеи Mantine — drawer уезжает за правый край.
    layout: 'fullscreen',
    controls: { disable: true },
  },
  decorators: [
    (Story, { globals, parameters }) => {
      const { language, colorScheme } = globals as Globals;
      return (
        <StoryProviders language={language} colorScheme={colorScheme} route={parameters.route}>
          <Story />
        </StoryProviders>
      );
    },
  ],
};

export default preview;

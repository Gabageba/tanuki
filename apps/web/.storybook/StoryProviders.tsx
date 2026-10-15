import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router';
import type { ColorScheme, Language } from '@tanuki/contracts';
import I18nProvider from '@/app/Providers/I18nProvider';
import MantineProvider from '@/app/Providers/MantineProvider';
import { I18N } from '@/shared/lib/i18n';
import type { StoryRoute } from '@/shared/storybook/models';
import ColorSchemeSync from './ColorSchemeSync';
import StoryRoutes from './StoryRoutes';

type Props = {
  language: Language;
  colorScheme: ColorScheme;
  /** Страница на своём маршруте; нет — компонент без маршрута, в роутере в памяти. */
  route?: StoryRoute;
  children: ReactNode;
};

/**
 * Провайдеры приложения (app/Providers) для историй: та же тема и i18n, но свой QueryClient на
 * каждую историю — без ретраев и без глобального обработчика ошибок — и роутер в памяти.
 */
function StoryProviders({ language, colorScheme, route, children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    void I18N.changeLanguage(language);
  }, [language]);

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ColorSchemeSync colorScheme={colorScheme} />
          <Notifications />
          <MemoryRouter initialEntries={route && [route.url]}>
            {route ? <StoryRoutes route={route}>{children}</StoryRoutes> : children}
          </MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default StoryProviders;

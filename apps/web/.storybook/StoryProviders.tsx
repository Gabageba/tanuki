import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell, Box } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router';
import type { ColorScheme, Language, CurrentUser } from '@tanuki/contracts';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';
import I18nProvider from '@/app/Providers/I18nProvider';
import MantineProvider from '@/app/Providers/MantineProvider';
import Footer from '@/app/Layout/Footer';
import { APP_SHELL_FOOTER, APP_SHELL_HEADER } from '@/shared/lib/appShell';
import { I18N } from '@/shared/lib/i18n';
import { STORY_FOOTER, type StoryFooter, type StoryRoute } from '@/shared/storybook/models';
import ColorSchemeSync from './ColorSchemeSync';
import StoryRoutes from './StoryRoutes';

type Props = {
  language: Language;
  colorScheme: ColorScheme;
  /** Страница на своём маршруте; нет — компонент без маршрута, в роутере в памяти. */
  route?: StoryRoute;
  /** Нижняя панель приложения под компонентом без маршрута. */
  footer: StoryFooter;
  children: ReactNode;
  initialUser?: CurrentUser;
};

/**
 * Провайдеры приложения (app/Providers) для историй: та же тема и i18n, но свой QueryClient на
 * каждую историю — без ретраев и без глобального обработчика ошибок — и роутер в памяти.
 */
function StoryProviders({ language, colorScheme, route, footer, children, initialUser }: Props) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          networkMode: 'offlineFirst',
          retry: false,
          staleTime: Infinity,
          refetchOnWindowFocus: false,
        },
        mutations: { retry: false },
      },
    });
    if (initialUser) client.setQueryData(CURRENT_USER_QUERY_KEY, initialUser);
    return client;
  });

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
            {route ? (
              <StoryRoutes route={route}>{children}</StoryRoutes>
            ) : (
              // Компонент без каркаса страницы, но с размерами AppShell и нижней панелью: drawer
              // снизу, как в приложении, не поднимается выше шапки и выезжает из-под панели.
              <AppShell
                header={APP_SHELL_HEADER}
                footer={footer === STORY_FOOTER.NONE ? undefined : APP_SHELL_FOOTER}
              >
                {children}
                {/* Панель только занимает своё место: в истории её кнопки никуда не ведут, а клик
                  по ней закрыл бы drawer. */}
                {footer === STORY_FOOTER.PANEL && (
                  <Box inert>
                    <Footer />
                  </Box>
                )}
              </AppShell>
            )}
          </MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default StoryProviders;

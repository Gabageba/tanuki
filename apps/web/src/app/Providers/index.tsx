import type { ReactNode } from 'react';
import QueryClientProvider from './QueryClientProvider';
import MantineProvider from './MantineProvider';
import RouterProvider from './RouterProvider';
import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
// Golos Text — интерфейс по умолчанию, без исключений на бренд-слой: 400 текст и навигация,
// 600 акценты/кнопки/названия, 700 заголовки тайтлов и блоков.
import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/golos-text/700.css';
// Unbounded — только лого, вес 600.
import '@fontsource/unbounded/600.css';
// JetBrains Mono — данные: номера, даты, счётчики, проценты, бейджи, мелкие капсом-лейблы.
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

type Props = {
  children: ReactNode;
};

function Providers({ children }: Props) {
  return (
    <QueryClientProvider>
      <MantineProvider>
        {children}
        <RouterProvider />
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default Providers;

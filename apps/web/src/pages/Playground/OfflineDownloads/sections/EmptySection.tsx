import { Paper, SimpleGrid, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import DownloadsEmpty from '../components/DownloadsEmpty';
import DownloadsPageMock from '../components/DownloadsPageMock';
import DownloadsUnsupported from '../components/DownloadsUnsupported';

/** E — пустые состояния страницы «Загрузки». */
function EmptySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Пустые состояния"
        description="Данные локальные, поэтому спиннера нет: пусто — сразу EmptyState. Слева — ничего не скачано, справа — браузер не умеет скачивать (приватное окно)."
      />
      <DemoSection
        code="E1"
        title="Коротко"
        description="Заголовок, одна фраза зачем и «Открыть каталог». Без поддержки — без кнопки."
        pros={['Не повторяет то, что пользователь и так видит в списке глав']}
        cons={['Новичок не узнает отсюда, где кнопка скачивания']}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} maw={1100}>
          <Paper withBorder radius="md" p="md">
            <DownloadsPageMock>
              <DownloadsEmpty />
            </DownloadsPageMock>
          </Paper>
          <Paper withBorder radius="md" p="md">
            <DownloadsPageMock>
              <DownloadsUnsupported />
            </DownloadsPageMock>
          </Paper>
        </SimpleGrid>
      </DemoSection>
      <DemoSection
        code="E2"
        title="С подсказкой"
        description="То же, но описание объясняет, как скачать, а без поддержки — что делать."
        pros={['Учит пользоваться прямо там, где пусто', 'Подсказывает выход из приватного окна']}
        cons={['Длиннее', 'Текст про стрелку устареет, если сменится иконка (ось C)']}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} maw={1100}>
          <Paper withBorder radius="md" p="md">
            <DownloadsPageMock>
              <DownloadsEmpty withHowTo />
            </DownloadsPageMock>
          </Paper>
          <Paper withBorder radius="md" p="md">
            <DownloadsPageMock>
              <DownloadsUnsupported withHowTo />
            </DownloadsPageMock>
          </Paper>
        </SimpleGrid>
      </DemoSection>
    </Stack>
  );
}

export default EmptySection;

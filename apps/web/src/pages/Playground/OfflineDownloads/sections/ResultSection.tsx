import { Stack, Text } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import FinalApp from '../components/final/FinalApp';
import FinalDownloads from '../components/final/FinalDownloads';
import FinalOffline from '../components/final/FinalOffline';
import FinalSettings from '../components/final/FinalSettings';
import FinalTitlePage from '../components/final/FinalTitlePage';
import { CHAPTER_TINT } from '../models';

/** ★ — выбранная комбинация, собранная вместе. */
function ResultSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="★"
        title="Итог"
        description="Выбранные варианты вместе. Список глав живой: карточка под обложкой сразу следует за состоянием глав, «Скачать все» открывает настоящую модалку."
      />
      <DemoSection
        code="C2e + D2 + B3 + M2 + Q2 + L4 + E2 + P2 + S2a + N2b + U1 + K·пусто + T1 + T2 + I1 + H1 + H11"
        title="Скачивание глав и офлайн"
        description="Тост обновления — один раз, пункт «Обновить приложение» с точкой в меню — пока обновление не применено; на аватаре точки нет. В тостах кнопки «Обновить» и «Установить». Подсказка iOS — тост один раз при первом скачивании и блок вверху «Загрузок» до «Не сейчас». Каталог без сети без заметки: объясняет полоса; в читалке полосы нет."
      >
        <Stack gap={48}>
          <Stack gap="sm">
            <Text fw={600}>Страница тайтла</Text>
            <FinalTitlePage tint={CHAPTER_TINT.ICON} />
          </Stack>
          <Stack gap="sm">
            <Text fw={600}>Загрузки</Text>
            <FinalDownloads />
          </Stack>
          <Stack gap="sm">
            <Text fw={600}>Профиль и настройки</Text>
            <FinalSettings />
          </Stack>
          <Stack gap="sm">
            <Text fw={600}>Без сети</Text>
            <FinalOffline />
          </Stack>
          <Stack gap="sm">
            <Text fw={600}>Обновление и установка</Text>
            <FinalApp />
          </Stack>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default ResultSection;

import { Box, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import SettingsDownloadsMock from '../components/SettingsDownloadsMock';
import { SETTINGS_LAYOUT } from '../models';

/** S — новая вкладка настроек «Загрузки». */
function SettingsSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Вкладка настроек"
        description="Настройки устройства (живут в локальных настройках, не на сервере): автоскачивание новых глав из выбранных папок закладок — пусто значит выключено; автоудаление прочитанных; объём и вход в «Загрузки»."
      />
      <DemoSection
        code="S1"
        title="Один блок"
        description="Один GroupedList «Загрузки»: две строки правил и строка «Скачано на этом устройстве» с кнопкой «Открыть загрузки»."
        pros={['Коротко, как остальные вкладки', 'Ничего, что нужно объяснять']}
        cons={['Объём смешан с правилами', 'Не видно, сколько места осталось']}
      >
        <Box maw={640}>
          <SettingsDownloadsMock layout={SETTINGS_LAYOUT.SINGLE} />
        </Box>
      </DemoSection>
      <DemoSection
        code="S2"
        title="Правила и хранилище отдельно"
        description="«Автоматически» — две строки правил; «Хранилище» — скачано, свободно на устройстве с полосой и статус защиты от очистки (persist)."
        pros={[
          'Видно, сколько ещё влезет, — до «Кончилось место»',
          'Видно, не сотрёт ли браузер скачанное',
        ]}
        cons={[
          '«Защита от очистки» новичку непонятна',
          'Свободное место повторяет модалку «Скачать главы»',
        ]}
      >
        <Box maw={640}>
          <SettingsDownloadsMock layout={SETTINGS_LAYOUT.SPLIT} />
        </Box>
      </DemoSection>
      <DemoSection
        code="S2a"
        title="S2 с полем и полосой на всю ширину"
        description="Раскладка S2, но поле папок и полоса свободного места тянутся на всю ширину строки, а не обрываются на 320 px."
        pros={[
          'Поле и полоса встают ровно по правому краю блока, как кнопки строк',
          'Полоса длиннее — разницу в несколько процентов видно',
        ]}
        cons={['На широком экране поле с одной папкой выглядит пустым']}
      >
        <Box maw={640}>
          <SettingsDownloadsMock layout={SETTINGS_LAYOUT.SPLIT_WIDE} />
        </Box>
      </DemoSection>
    </Stack>
  );
}

export default SettingsSection;

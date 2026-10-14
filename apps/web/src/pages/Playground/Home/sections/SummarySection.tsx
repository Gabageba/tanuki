import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import DiscoverFinalPage from '../components/DiscoverFinalPage';
import FooterMock from '../components/FooterMock';
import HeaderMock from '../components/HeaderMock';
import HomeEmpty from '../components/HomeEmpty';
import HomeFinalPage from '../components/HomeFinalPage';
import HomeSettingsHint from '../components/HomeSettingsHint';
import SettingsExpanded from '../components/SettingsExpanded';
import { MOCK_HOME_SETTINGS, MOCK_MISSED } from '../mocks';
import { HEADER_HIGHLIGHT, HEADER_HOME, MOCK_PAGE, SETTINGS_BLOCKS } from '../models';

const SUMMARY_CODE =
  'P4a + V2a + W2 (без «Из подборок» и «Давно не открывали») + C1a + U1 + P3a + K1 + L4 + Z1 + H3a + B1 + T1a + E2';

/** Итог — выбранная комбинация целиком: главная, страница подборок, вкладка настроек, пустые
 *  подборки. */
function SummarySection() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="★"
        title="Итог"
        description="Подборки ушли с главной на свою страницу. Главная — только «моё» и два входа: в подборки и во все источники. На странице подборок — один источник за раз."
      />
      <DemoSection
        code={SUMMARY_CODE}
        title="Главная"
        description="Шапка H3 с выделением своей страницы (H3a). «Продолжить чтение» C1a с «⋯» (U1), «Новые главы в закладках» списком в две колонки, плитки «Подборки» и «Источники» (V2a). На телефоне — нижняя панель B1."
      >
        <VariantFrames
          phone={
            <Stack gap="lg">
              <HomeFinalPage />
              <FooterMock withHome page={MOCK_PAGE.HOME} />
            </Stack>
          }
        >
          <Stack gap="lg">
            <HeaderMock
              variant={HEADER_HOME.ICON_LEFT}
              page={MOCK_PAGE.HOME}
              highlight={HEADER_HIGHLIGHT.LIGHT}
            />
            <HomeFinalPage />
          </Stack>
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="P3a + K1 + L4 + Z1"
        title="Подборки"
        description="Отдельная страница, «Назад» — на главную. Чипы источников; у выбранного — заголовок с кнопкой «Каталог Реманги» и все его блоки лентами. Пока блоки грузятся — скелетон с настоящими названиями блоков. Открыт источник, с карточки которого пришли, иначе — последний выбранный."
      >
        <SandboxOnly>
          <Group gap="sm">
            <Text fz="sm">Блоки источника</Text>
            <SegmentedControl
              value={isLoading ? 'loading' : 'loaded'}
              onChange={(value) => setIsLoading(value === 'loading')}
              data={[
                { value: 'loaded', label: 'Ответ' },
                { value: 'loading', label: 'Загрузка' },
              ]}
            />
          </Group>
        </SandboxOnly>
        <VariantFrames>
          <DiscoverFinalPage isLoading={isLoading} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="Подборки · не ответил"
        title="Выбранный источник не ответил"
        description="Не было в вариантах — предлагаю: на месте блоков причина и «Повторить запрос подборок» (или «Войти в …» у закрытого). Строки «Не ответили» из поиска здесь нет: источник на странице один. Последний чип — Usagi, он «не успел»."
      >
        <VariantFrames>
          <DiscoverFinalPage isLoading={false} initialId={MOCK_MISSED[0]?.source.id} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="T1a"
        title="Настройки → Подборки"
        description="Вкладка называется «Подборки». У источника переключатель «Показывать в подборках», под ним галочки его блоков одной колонкой."
      >
        <VariantFrames>
          <Stack gap="lg" maw={640}>
            <HomeSettingsHint isSelectionsTab />
            <SettingsExpanded
              homes={MOCK_HOME_SETTINGS}
              blocksLayout={SETTINGS_BLOCKS.COLUMN}
              isSelectionsTab
            />
          </Stack>
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="E2"
        title="Подборок нет"
        description="Теперь это пустая страница подборок, а не главной: главная пустой не бывает. Все источники выключены в подборках — «Настроить подборки» и «Все источники»."
      >
        <VariantFrames>
          <HomeEmpty
            icon={<SparkleIcon />}
            title="Подборок нет"
            description="Все источники выключены в настройках подборок."
            settingsLabel="Настроить подборки"
            withAllSources
          />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default SummarySection;

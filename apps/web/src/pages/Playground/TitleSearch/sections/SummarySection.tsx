import { Stack, Text } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import CatalogLikeSheet from '../components/CatalogLikeSheet';
import EmptyPageTitle from '../components/EmptyPageTitle';
import HeaderSearchMock from '../components/HeaderSearchMock';
import RecentDropdownFooter from '../components/RecentDropdownFooter';
import SearchInvite from '../components/SearchInvite';
import SummaryResultsPage from '../components/SummaryResultsPage';
import VariantFrames from '../components/VariantFrames';
import { FINAL_SUMMARY_CONFIG } from '../models';

/** Выбранная комбинация целиком: страница с запросом, строка поиска в фокусе, пустая /search. */
function SummarySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Итог"
        title="Выбранная комбинация"
        description="Всё вместе, как будет в приложении. Переключите «Список» вверху страницы — увидите V1. Фильтры живые: выберите источники, тип или статус и нажмите «Применить» — секции, чипы «Нашлось на:» и «Не ответили» пересчитаются так, как по плану считает сервер; если ничего не останется — «Ничего не найдено» со «Сбросить фильтры»."
      />
      <DemoSection
        code="H6c + S1 + L1s + N3 + D2 + E5 + F6 + G3 + M1 + C1 + V1 + N5 + R2"
        title="Поиск тайтлов"
        description="Шапка — «Результаты по «…»» и чипы источников с подписью «Нашлось на:» (H6c) с обычным скруглением кнопок (C1). Под ней, как в каталоге, «Фильтры» слева и вид карточек у правого края, пилюли ниже (F6, G3); на телефоне «Фильтры» растянута, а вид — справа в той же строке (M1). Секции — SourceTitle и «Все результаты» справа (S1), разделены линией с отступом xl (R2); обложки — лентой на Scroller (L1s), в виде «список» — три карточки и «Показать ещё» (V1). Не ответившие — свёрнутым блоком, раскрытый — строками мини-списка (N3 + N5). Недавние — в дропдауне строки поиска, крестик всегда, «Очистить» внизу (D2); пустая /search — только приглашение (E5)."
      >
        <Stack gap="xl">
          <Stack gap="xs">
            <Text fz="sm" fw={600}>
              /search с запросом (H6c + C1 + F6 + G3 + M1 + S1 + R2 + L1s + V1 + N3 + N5)
            </Text>
            <VariantFrames
              extraPhones={[
                { label: '375 px · drawer «Все фильтры»', content: <CatalogLikeSheet /> },
              ]}
            >
              <SummaryResultsPage config={FINAL_SUMMARY_CONFIG} />
            </VariantFrames>
          </Stack>
          <Stack gap="xs">
            <Text fz="sm" fw={600}>
              Строка поиска в фокусе (D2)
            </Text>
            <VariantFrames>
              <HeaderSearchMock dropdown={<RecentDropdownFooter />} />
            </VariantFrames>
          </Stack>
          <Stack gap="xs">
            <Text fz="sm" fw={600}>
              /search без запроса (E5)
            </Text>
            <VariantFrames>
              <Stack gap="md">
                <EmptyPageTitle />
                <SearchInvite />
              </Stack>
            </VariantFrames>
          </Stack>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default SummarySection;

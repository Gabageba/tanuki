import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import OfflineCatalogEmpties from '../components/OfflineCatalogEmpties';
import OfflineCatalogVariant from '../components/OfflineCatalogVariant';
import { OFFLINE_CATALOG } from '../models';

/** K — каталог источника и поиск, когда нет сети. */
function OfflineCatalogSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="K"
        title="Каталог и поиск без сети"
        description="Без сети каталог Mangalib показывает скачанные тайтлы этого источника (свежие первыми), а /search ищет подстроку по названиям скачанного, группами по источникам. Поле поиска остаётся, фильтров и сортировок нет. Онлайн всё как сейчас."
      />
      <DemoSection
        code="K1"
        title="Заметка вместо фильтров"
        description="Золотая заметка на месте панели фильтров объясняет, что показано."
        pros={['Причина видна там, где пропали фильтры', 'Тот же язык, что у индикации «Нет сети»']}
        cons={['Ещё один блок над сеткой — на телефоне это треть экрана до первой обложки']}
      >
        <OfflineCatalogVariant variant={OFFLINE_CATALOG.NOTE} />
      </DemoSection>
      <DemoSection
        code="K2"
        title="Заголовок меняется"
        description="«Скачанное из Mangalib» и «Среди скачанного: …» вместо обычных заголовков; фильтры просто исчезают."
        pros={['Чисто, без лишних блоков', 'Заголовок сам говорит, что это за список']}
        cons={[
          'Почему так, не сказано — без индикации N можно не понять',
          'Заголовок поиска становится длинным',
        ]}
      >
        <OfflineCatalogVariant variant={OFFLINE_CATALOG.HEADING} />
      </DemoSection>
      <DemoSection
        code="K3"
        title="Фильтры видны, но неактивны"
        description="Панель фильтров и сортировка на месте, но погашены с подсказкой «Недоступно без сети»."
        pros={['Раскладка не прыгает при пропаже и возврате сети']}
        cons={[
          'Мёртвые кнопки — их нажимают и ничего не происходит',
          'На телефоне подсказка по наведению не работает',
        ]}
      >
        <OfflineCatalogVariant variant={OFFLINE_CATALOG.DISABLED_FILTERS} />
      </DemoSection>
      <DemoSection
        code="K·пусто"
        title="Пустые состояния"
        description="Общие для всех вариантов: из источника ничего не скачано и среди скачанного не нашлось."
      >
        <OfflineCatalogEmpties />
      </DemoSection>
    </Stack>
  );
}

export default OfflineCatalogSection;

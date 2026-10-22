import { SimpleGrid, Stack, Text } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import ChapterListDemo from '../components/ChapterListDemo';
import { OFFLINE_CHAPTER_ROWS } from '../mocks';
import { CHAPTER_ICON, OFFLINE_ROW } from '../models';

/** D — не скачанная глава в списке, когда нет сети. */
function OfflineRowSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="D"
        title="Глава без сети"
        description="Без сети открываются только скачанные главы (86 и 85). Остальные строки остаются в списке, но нажать их — значит попасть на «Глава не скачана». Слева — с иконкой C1, справа — с C3."
      />
      <DemoSection
        code="D1"
        title="Строка приглушена"
        description="Не скачанная глава бледнеет, стрелка пропадает — скачать без сети всё равно нельзя."
        pros={['Ничего нового в строке', 'Скачанное сразу выделяется контрастом']}
        cons={['Бледное легко спутать с прочитанным или неактивным по другой причине']}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} maw={1100}>
          <ChapterListDemo
            chapters={OFFLINE_CHAPTER_ROWS}
            variant={CHAPTER_ICON.BUTTON}
            offlineRow={OFFLINE_ROW.DIMMED}
          />
          <ChapterListDemo
            chapters={OFFLINE_CHAPTER_ROWS}
            variant={CHAPTER_ICON.NUMBER_MARK}
            offlineRow={OFFLINE_ROW.DIMMED}
          />
        </SimpleGrid>
      </DemoSection>
      <DemoSection
        code="D2"
        title="Приглушена и перечёркнутое облако"
        description="Как D1, но на месте стрелки — перечёркнутое облако с подсказкой «Глава не скачана — без сети не открыть»."
        pros={[
          'Причина видна в самой строке',
          'Тот же значок, что и в индикации «Нет сети» (ось N)',
        ]}
        cons={['Ещё одна иконка в ряду у каждой второй строки', 'Шумно в длинном списке']}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} maw={1100}>
          <ChapterListDemo
            chapters={OFFLINE_CHAPTER_ROWS}
            variant={CHAPTER_ICON.BUTTON}
            offlineRow={OFFLINE_ROW.DIMMED_ICON}
          />
          <ChapterListDemo
            chapters={OFFLINE_CHAPTER_ROWS}
            variant={CHAPTER_ICON.NUMBER_MARK}
            offlineRow={OFFLINE_ROW.DIMMED_ICON}
          />
        </SimpleGrid>
      </DemoSection>
      <Text c="dimmed" fz="sm" maw={760}>
        В обоих вариантах нажатие на не скачанную строку открывает читалку с «Глава не скачана» —
        вид этого экрана в оси U.
      </Text>
    </Stack>
  );
}

export default OfflineRowSection;

import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import TitlesPair from '../components/TitlesPair';
import { LIBRARY_PREVIEW } from '../mocks';
import { IMPORTED_VIEW } from '../models';

/** A — как отличить уже импортированные. */
function ImportedSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="A"
        title="Уже в закладках"
        description="Повторный импорт: тайтл уже лежит в той же папке. Он снят, но выбрать его можно — тогда отметка обновится по политике. «Семья шпиона», «Королевство» и «Ад и рай» уже импортированы. Остальное — база L1 + K1 + R2 + P0 + M1."
      />
      <DemoSection
        code="A1"
        title="В конце группы, приглушены"
        description="Уже импортированные уходят в конец своей папки сайта, сняты, название серое, подпись «Уже в закладках»."
        pros={[
          'Новое — сверху каждой группы',
          'Всё на виду: выбрать для обновления отметки — один тап',
        ]}
        cons={['Хвост из серых строк в каждой группе', 'Порядок сайта нарушен']}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ imported: IMPORTED_VIEW.DIMMED_LAST }} />
      </DemoSection>
      <DemoSection
        code="A2"
        title="Свёрнуты в одну строку"
        description="В конце группы — «Ещё 2 уже в закладках»; раскрывается в те же строки, что в A1."
        pros={['Повторный импорт короткий: видно только новое', 'Хвоста серых строк нет']}
        cons={[
          'Чтобы обновить отметку старого тайтла, надо раскрыть',
          'Строка-кнопка в списке чекбоксов выбивается из ряда',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ imported: IMPORTED_VIEW.COLLAPSED }} />
      </DemoSection>
      <DemoSection
        code="A3"
        title="На своём месте, с бейджем"
        description="Порядок сайта не трогаем: уже импортированный стоит, где стоял, снят и с серым бейджем «Уже есть»."
        pros={[
          'Порядок как на сайте — легко сверить глазами',
          'Строка не серая — читается наравне с остальными',
        ]}
        cons={[
          'Новое перемешано со старым — при повторном импорте ищешь глазами',
          'Ещё один бейдж рядом с бейджем папки',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ imported: IMPORTED_VIEW.BADGE }} />
      </DemoSection>
    </Stack>
  );
}

export default ImportedSection;

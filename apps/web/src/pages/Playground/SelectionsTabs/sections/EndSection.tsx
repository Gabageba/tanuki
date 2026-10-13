import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { SEL_REMANGA } from '../mocks';
import { BASE_LOOK, BLOCK_END, FEED_STATE, type BlockEnd } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  end: BlockEnd;
};

const VARIANTS: Variant[] = [
  {
    code: 'E1',
    title: 'Строка внизу',
    description:
      'Под последним рядом тихая строка «Сайт показывает в этом блоке только эти тайтлы». Вкладки у всех блоков одинаковые.',
    pros: ['Объясняет, почему список кончился, и ничего не добавляет наверх'],
    cons: ['Заранее не видно, что блок короткий'],
    end: BLOCK_END.NOTE,
  },
  {
    code: 'E2',
    title: 'Строка и ссылка в каталог',
    description: 'Та же строка и под ней «Каталог: Реманга» — туда, где листать можно дальше.',
    pros: ['Подсказывает, куда идти за продолжением'],
    cons: ['Ссылка повторяет «Каталог» в шапке страницы', 'Каталог — не тот же список, что блок'],
    end: BLOCK_END.NOTE_CATALOG,
  },
  {
    code: 'E3',
    title: 'Число на вкладке',
    description:
      'У блока без продолжения на вкладке число тайтлов моноширинным, как у папок закладок; у листаемых — ничего. Внизу — строка E1.',
    pros: ['Короткий блок виден до того, как его открыли'],
    cons: [
      'Число без объяснения: «20» — это всё или первая порция?',
      'Разнобой: у одних вкладок число есть, у других нет',
    ],
    end: BLOCK_END.TAB_COUNT,
  },
  {
    code: 'E4',
    title: 'Разделитель с подписью',
    description: 'Конец сетки отбит линией с той же подписью посередине.',
    pros: ['Граница заметнее строки'],
    cons: ['Линия обещает следующий раздел, а его нет'],
    end: BLOCK_END.DIVIDER,
  },
];

/** Ось E — блок без продолжения; открыт «В тренде» Реманги — слайдер на 20 тайтлов. */
function EndSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Блок без продолжения"
        description="У HTML-главных (Grouple, MangaBuff, Desu, chan…) и слайдеров Реманги следующей порции нет — только то, что на главной. Открыт «В тренде» Реманги, окно прокручено к концу. У листаемых блоков конец ничем не отмечен — как в каталоге."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, end }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <SelectionsMock
              look={{ ...BASE_LOOK, end }}
              initialSourceId={SEL_REMANGA.source.id}
              initialBlockId="trending"
              state={FEED_STATE.END}
            />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default EndSection;

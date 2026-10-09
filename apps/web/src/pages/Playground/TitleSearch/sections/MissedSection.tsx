import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import MissedCollapse from '../components/MissedCollapse';
import MissedCurrent from '../components/MissedCurrent';
import MissedLine from '../components/MissedLine';
import MissedList from '../components/MissedList';
import MissedPills from '../components/MissedPills';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import { MOCK_MISSED } from '../mocks';
import type { Variant } from '../models';

const VARIANTS: Variant[] = [
  {
    code: 'N0',
    title: 'Как сейчас',
    description:
      'Каждый не ответивший — отдельной секцией с цветным бейджем статуса; недоступные (degraded/down) не опрашиваются и не видны вовсе.',
    pros: ['Видно сразу, вперемешку с результатами'],
    cons: [
      'Пустые секции разбивают выдачу, бейджи статусов — между обложками',
      'MangaBuff пропал без следа: непонятно, что там не искали',
    ],
    render: () => (
      <VariantFrames>
        <MissedCurrent missed={MOCK_MISSED} />
      </VariantFrames>
    ),
  },
  {
    code: 'N1',
    title: 'Одна приглушённая строка',
    description:
      '«Не ответили: Usagi — не успел · Inkstory — ошибка · …» одним абзацем; у «нужен вход» — «Войти»; «Повторить» в конце.',
    pros: ['Самый компактный: не спорит с выдачей'],
    cons: [
      'При четырёх источниках на телефоне — пять строк сплошного текста',
      'Причину ищешь глазами внутри абзаца',
    ],
    render: () => (
      <VariantFrames>
        <MissedLine missed={MOCK_MISSED} />
      </VariantFrames>
    ),
  },
  {
    code: 'N2',
    title: 'Пилюли источников',
    description:
      'Пилюля на источник: логотип, название и причина; «Войти» внутри пилюли; «Повторить» — в конце ряда.',
    pros: ['Источники выхватываются по логотипу', 'Переносится по пилюлям, а не посреди фразы'],
    cons: [
      'Пилюли выглядят как снимаемые фильтры над выдачей',
      'Ссылка «Войти» внутри пилюли — мелкая цель',
    ],
    render: () => (
      <VariantFrames>
        <MissedPills missed={MOCK_MISSED} />
      </VariantFrames>
    ),
  },
  {
    code: 'N3',
    title: 'Свёрнутый блок',
    description:
      'Одна строка «Не ответили 4 источника» и «Повторить»; по клику раскрывается список с причинами.',
    pros: ['По умолчанию почти не занимает места при любом числе источников'],
    cons: [
      'Причины спрятаны — а «нужен вход» как раз стоило бы показать сразу',
      'Лишний клик, чтобы понять, повторять или нет',
    ],
    render: () => (
      <VariantFrames>
        <MissedCollapse missed={MOCK_MISSED} />
      </VariantFrames>
    ),
  },
  {
    code: 'N4',
    title: 'Мини-список',
    description:
      'Блок в рамке: шапка «Не ответили» с «Повторить», ниже — строка на источник, причина справа, «Войти» рядом с ней.',
    pros: ['Читается одинаково на любой ширине', 'Причины выровнены столбиком'],
    cons: ['Самый высокий: 4 источника — 5 строк', 'Рамка делает сбой заметнее найденного'],
    render: () => (
      <VariantFrames>
        <MissedList missed={MOCK_MISSED} />
      </VariantFrames>
    ),
  },
];

/** Ось N — строка «Не ответили». */
function MissedSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="N"
        title="«Не ответили»"
        description="Вопрос 4 плана. Стоит под секциями; по одному источнику на каждую причину — не успел, ошибка, нужен вход, недоступен. «Повторить» перезапрашивает всю выдачу."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default MissedSection;

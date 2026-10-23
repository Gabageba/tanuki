import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import AccountsMock from '../components/AccountsMock';
import { HEADER_BUTTON, type HeaderButton } from '../models';

type Variant = {
  code: string;
  button: HeaderButton;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    code: 'H0',
    button: HEADER_BUTTON.NONE,
    title: 'Как сейчас',
    description: 'У вошедшей сети только «Отвязать»; импорт — только из профиля.',
    pros: ['Шапка спокойная'],
    cons: ['Только что вошёл — и не видно, что закладки можно забрать'],
  },
  {
    code: 'H1',
    button: HEADER_BUTTON.MUTED,
    title: 'Muted, как «Войти»',
    description:
      'Того же веса и цвета, что «Войти» у соседней сети: главное действие для вошедшей сети.',
    pros: ['Заметна сразу после входа', 'Тот же вес, что у остальных кнопок шапок'],
    cons: [
      'Спорит с «Войти» соседней сети — обе в фирменном цвете',
      'На телефоне полный текст рядом с «Отвязать» едва помещается',
    ],
  },
  {
    code: 'H2',
    button: HEADER_BUTTON.DEFAULT,
    title: 'Default',
    description: 'Обычная серая кнопка с рамкой — заметна, но не в фирменном цвете.',
    pros: ['Не спорит с «Войти» соседней сети', 'Видна сразу, в отличие от subtle'],
    cons: ['Серая рядом с красной «Отвязать» — три разных веса в шапках'],
  },
  {
    code: 'H3',
    button: HEADER_BUTTON.SUBTLE,
    title: 'Subtle',
    description: 'Без рамки и фона, текстом в фирменном цвете — тише всего.',
    pros: ['Самая тихая: состояние «Вход выполнен» главнее'],
    cons: ['Похожа на ссылку, а не на действие', 'Рядом с muted «Отвязать» выглядит недоделанной'],
  },
  {
    code: 'H4',
    button: HEADER_BUTTON.ICON,
    title: 'Иконка с подсказкой',
    description: 'ActionIcon с облаком, название — в подсказке при наведении.',
    pros: ['Не занимает места ни на какой ширине'],
    cons: [
      'Облако со стрелкой без подписи не читается как «импорт закладок»',
      'На телефоне подсказки нет',
    ],
  },
  {
    code: 'H5',
    button: HEADER_BUTTON.SHORT_ON_PHONE,
    title: 'H2, на телефоне «Импорт»',
    description: 'На десктопе полный текст, на телефоне — «Импорт»: две кнопки под шапкой поровну.',
    pros: ['На телефоне обе кнопки целиком, без обрезки'],
    cons: ['«Импорт» без объекта — против правила «кнопка называет объект»'],
  },
  {
    code: 'H6',
    button: HEADER_BUTTON.ICON_ON_PHONE,
    title: 'H2, на телефоне иконка',
    description:
      'На десктопе полный текст, на телефоне — квадратная иконка рядом с широкой «Отвязать».',
    pros: ['«Отвязать» остаётся широкой и понятной'],
    cons: ['На телефоне то же, что H4: облако без подписи'],
  },
];

/** H — кнопка импорта в шапке вошедшей сети на «Аккаунтах источников». */
function HeaderButtonSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Кнопка в «Аккаунтах источников»"
        description="«Импортировать закладки» в шапке вошедшей сети, рядом с «Отвязать»; ниже — сеть без входа с «Войти», чтобы видеть, не спорят ли кнопки. На телефоне кнопки шапки, как в приложении, встают под неё во всю ширину."
      />
      {VARIANTS.map((variant) => (
        <DemoSection
          key={variant.code}
          code={variant.code}
          title={variant.title}
          description={variant.description}
          pros={variant.pros}
          cons={variant.cons}
        >
          <Group align="flex-start" gap="lg">
            <CaptionedFrame caption="Десктоп">
              <AccountsMock button={variant.button} />
            </CaptionedFrame>
            <CaptionedFrame caption="Телефон · 375 px">
              <AccountsMock button={variant.button} isPhone />
            </CaptionedFrame>
          </Group>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default HeaderButtonSection;

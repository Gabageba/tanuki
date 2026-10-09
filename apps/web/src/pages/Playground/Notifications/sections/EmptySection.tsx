import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { getTypeCategory } from '../lib';
import { MOCK_FEED } from '../mocks';
import { EMPTY, MOCK_CATEGORY } from '../models';

/** Ось E: пустая лента. */
function EmptySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Пустая лента"
        description="Лента пуста целиком. У E3 ниже ещё второе состояние — фильтр скрыл всё (выбрана «Администрирование», а в ленте её нет)."
      />
      <DemoSection
        code="E1"
        title="Сухо"
        description="Только «Новых уведомлений нет»."
        pros={['Минимум, ничего лишнего']}
        cons={['Не объясняет, откуда берутся уведомления']}
      >
        <Frames>
          <FeedPageMock items={[]} empty={EMPTY.PLAIN} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="E2"
        title="С описанием и ссылкой"
        description="Что здесь появится и кнопка «Перейти в закладки»."
        pros={['Объясняет смысл ленты и ведёт дальше']}
        cons={['Ссылка нужна не всем']}
      >
        <Frames>
          <FeedPageMock items={[]} empty={EMPTY.DESCRIBED} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="E3"
        title="Разный текст для разных причин"
        description="Пусто без фильтра — как E2; пусто из-за фильтра — «В этой категории ничего нет» и «Сбросить фильтр»."
        pros={['Не путает «ничего нет» и «фильтр скрыл всё»']}
        cons={['Больше текстов и ключей']}
      >
        <Frames>
          <Stack gap="xl">
            <FeedPageMock items={[]} empty={EMPTY.BY_REASON} />
            <FeedPageMock
              items={MOCK_FEED.filter(
                (item) => getTypeCategory(item.type) !== MOCK_CATEGORY.ADMINISTRATION,
              )}
              empty={EMPTY.BY_REASON}
              initialSelected={[MOCK_CATEGORY.ADMINISTRATION]}
            />
          </Stack>
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default EmptySection;

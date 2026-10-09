import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { MOCK_LONG_FEED } from '../mocks';
import { PAGINATION } from '../models';

/** Ось P: страницы или «Показать ещё». */
function PaginationSection() {
  return (
    <Stack gap="xl">
      <AxisHeading letter="P" title="Страницы" description="47 записей, 20 на страницу." />
      <DemoSection
        code="P1"
        title="ListPagination"
        description="Общий компонент: «21–40 из 47» и страницы."
        pros={['Правило проекта', 'Известна позиция в списке']}
        cons={['Внизу страницы нужно листать']}
      >
        <Frames>
          <FeedPageMock items={MOCK_LONG_FEED} pagination={PAGINATION.PAGES} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="P2"
        title="«Показать ещё»"
        description="Кнопка внизу, лента растёт."
        pros={['Лента как поток, на телефоне привычнее']}
        cons={['Нет общего счётчика и позиции', 'Длинная лента тяжелее']}
      >
        <Frames>
          <FeedPageMock items={MOCK_LONG_FEED} pagination={PAGINATION.LOAD_MORE} />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default PaginationSection;

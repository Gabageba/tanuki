import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { FILTER } from '../models';

/** Ось F: фильтр категорий. */
function FilterSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="F"
        title="Фильтр категорий"
        description="Все три живые. Пустой выбор — без ограничения. Убранные строки учитываются в числах F3."
      />
      <DemoSection
        code="F1"
        title="CompactMultiSelect"
        description="Общий компонент, как в каталоге. На телефоне поле на всю ширину, «Отметить все» под ним."
        pros={['Правило проекта, поле не растёт в высоту', 'Мультивыбор']}
        cons={['Фильтр спрятан за кликом', 'Числа по категориям не видны']}
      >
        <Frames>
          <FeedPageMock filter={FILTER.SELECT} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="F2"
        title="Чипы с горизонтальным скроллом"
        description="Все категории на виду, выбор — несколько. На узком экране ряд скроллится."
        pros={['Категории видны без клика']}
        cons={['Нужен свой компонент', 'Мультивыбор через чипы менее очевиден']}
      >
        <Frames>
          <FeedPageMock filter={FILTER.CHIPS} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="F3"
        title="Сегменты со счётчиками"
        description="Одна категория за раз, у каждой — число непрочитанного."
        pros={['Видно, где что непрочитано']}
        cons={[
          'Одна категория за раз',
          'На телефоне ряд скроллится, «Администрирование» удлиняет его',
        ]}
      >
        <Frames>
          <FeedPageMock filter={FILTER.SEGMENTS} />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default FilterSection;

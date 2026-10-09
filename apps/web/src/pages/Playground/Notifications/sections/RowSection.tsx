import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { COUNTER, LEADING } from '../models';

/** Оси L и N: что слева в строке ленты и как показать число новых глав. */
function RowSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="L"
        title="Что слева в строке"
        description="Лента админа: по строке на каждый тип. Строки живые — клик по строке или «×» убирает её, фильтр и «Отметить все» работают. Тон иконки: красный — безопасность, золотой — источник лёг, зелёный — ожил, серый — администрирование."
      />
      <DemoSection
        code="L1"
        title="Обложка у новых глав, иконка по типу у остальных"
        description="Тайтл узнаётся по обложке; события аккаунта и источников — иконка в тонированном круге."
        pros={[
          'Тайтл виден сразу, обложка служит якорем',
          'Новые главы отличаются от системных событий',
        ]}
        cons={['Строки разной высоты: обложка выше иконки', 'Загрузка обложек в ленте']}
      >
        <Frames>
          <FeedPageMock leading={LEADING.COVER_AND_ICON} counter={COUNTER.WORDS} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="L2"
        title="Всегда иконка категории в тонированном круге"
        description="Ни одной картинки: у новых глав акцентная иконка книги, у остальных — по типу."
        pros={['Ровная лента, тон читается по всем строкам', 'Нет загрузки картинок']}
        cons={['Тайтл различается только по названию']}
      >
        <Frames>
          <FeedPageMock leading={LEADING.ICON} counter={COUNTER.WORDS} />
        </Frames>
      </DemoSection>
      <AxisHeading
        letter="N"
        title="Число новых глав"
        description="Закладки отказались от числа в пользу точки, но лента — другое место. Здесь сравниваются два способа на варианте L1."
      />
      <DemoSection
        code="N1"
        title="Словами во второй строке"
        description="«3 новые главы · 2 ч назад»: число внутри фразы, склоняется."
        pros={['Ближе к закладкам, где числа убрали', 'Фраза читается целиком']}
        cons={['Число сложнее пробежать глазами по ленте']}
      >
        <Frames>
          <FeedPageMock leading={LEADING.COVER_AND_ICON} counter={COUNTER.WORDS} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2"
        title="Моноширинная пилюля «+N» справа"
        description="Вторая строка говорит «Новые главы», число вынесено в `Badge variant=muted`."
        pros={[
          'Числа выстраиваются в столбик',
          'Моноширинное число — «показание» по правилу шрифтов',
        ]}
        cons={[
          'Возвращает счётчик, от которого отказались закладки',
          'Занимает ширину справа на узком экране',
        ]}
      >
        <Frames>
          <FeedPageMock leading={LEADING.COVER_AND_ICON} counter={COUNTER.PILL} />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default RowSection;

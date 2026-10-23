import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import TitlesPair from '../components/TitlesPair';
import { LIBRARY_PREVIEW } from '../mocks';
import { PROGRESS_VIEW } from '../models';

/** P — показывать ли в строке, что отметка расходится с вашей. */
function ProgressSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="P"
        title="Расхождение отметки"
        description="У «Берсерка», «Бродяги» и «Семьи шпиона» на сайте одна глава, у вас другая — из-за них будет вопрос «Где остановился». Остальное — база L1 + K1 + R2 + A1 + M1."
      />
      <DemoSection
        code="P0"
        title="Только «Гл. N» с сайта"
        description="В строке — где остановился на сайте; что у вас по-другому, видно только числом на шаге «Вопросы»."
        pros={['Строка проще', 'Один источник правды о конфликтах — шаг «Вопросы»']}
        cons={['«5 отметок расходятся» на шаге «Вопросы» не сказать, у каких тайтлов']}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ progress: PROGRESS_VIEW.HIDDEN }} />
      </DemoSection>
      <DemoSection
        code="P1"
        title="«Гл. 149 · у вас 312»"
        description="Если отметка другая — рядом ваша, золотым: видно, у каких тайтлов будет вопрос и насколько они расходятся."
        pros={[
          'Понятно, откуда взялся вопрос и стоит ли брать отметку с сайта',
          'Можно снять тайтл, если отметка на сайте старая',
        ]}
        cons={[
          'Ещё один элемент в строке',
          'Золотой цвет читается как предупреждение, хотя ничего страшного',
        ]}
      >
        <TitlesPair folders={LIBRARY_PREVIEW} config={{ progress: PROGRESS_VIEW.BOTH }} />
      </DemoSection>
    </Stack>
  );
}

export default ProgressSection;

import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeSourceSection from '../components/HomeSourceSection';
import { HOME_MANGALIB } from '../mocks';
import { SHORT_BLOCKS } from '../models';

/** Ось K — блоки из трёх–пяти тайтлов. */
function ShortSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="K"
        title="Короткий блок"
        description="MangaLib: «Популярное» и «Новинки» длинные, за ними три «Сейчас читают» по три тайтла, затем снова длинный блок. Вид секции — S1."
      />
      <DemoSection
        code="K1"
        title="Та же лента"
        description="Короткий блок — такая же лента, просто кончается раньше. Одно правило для всех блоков."
        pros={[
          'порядок блоков как на сайте, ничего не переставляется',
          'вид не зависит от того, сколько пришло',
        ]}
        cons={[
          'на десктопе справа от трёх карточек — пустое место',
          'три коротких блока подряд — три строки по три обложки',
        ]}
      >
        <VariantFrames>
          <HomeSourceSection home={HOME_MANGALIB} />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="K2"
        title="Короткие блоки в один ряд"
        description="Соседние блоки до пяти тайтлов встают рядом колонками; на телефоне — как K1, друг под другом. Длинные блоки по-прежнему на всю ширину."
        pros={[
          'нет дыр справа на десктопе',
          'три «Сейчас читают» видны разом — их удобно сравнить',
        ]}
        cons={[
          'раскладка зависит от того, сколько пришло: блок вырос до шести — уехал в свою строку',
          'в узкой колонке лента со стрелками тесная, названия блоков переносятся',
          'на телефоне разницы с K1 нет',
        ]}
      >
        <VariantFrames>
          <HomeSourceSection home={HOME_MANGALIB} shortBlocks={SHORT_BLOCKS.SIDE_BY_SIDE} />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default ShortSection;

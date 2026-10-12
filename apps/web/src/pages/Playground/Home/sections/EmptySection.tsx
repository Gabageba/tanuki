import { Stack } from '@mantine/core';
import { BookOpenIcon, HouseIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeEmpty from '../components/HomeEmpty';

/** Ось E — пустая главная: все источники выключены и ничего не читал. */
function EmptySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Пустая главная"
        description="Все источники выключены на главной и читать ещё нечего. Если выключено всё, но есть «Продолжить чтение», — пустого состояния нет, только лента."
      />
      <DemoSection
        code="E1"
        title="По плану"
        description="Домик, «На главной пусто», одна кнопка «Настроить главную» → вкладка «Главная» в настройках."
        pros={['одна понятная кнопка — туда, где это чинится']}
        cons={['домик не говорит, почему пусто', 'новому пользователю некуда пойти читать']}
      >
        <VariantFrames>
          <HomeEmpty
            icon={<HouseIcon />}
            title="На главной пусто"
            description="Все подборки выключены в настройках."
          />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="E2"
        title="Плюс «Все источники»"
        description="Как E1 и вторая кнопка — в /sources, чтобы было где начать читать, не включая подборки."
        pros={['выход и для того, кто подборки выключил нарочно']}
        cons={['две равные кнопки — неясно, какая главная']}
      >
        <VariantFrames>
          <HomeEmpty
            icon={<HouseIcon />}
            title="На главной пусто"
            description="Все подборки выключены в настройках."
            withAllSources
          />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="E3"
        title="Иконка о причине"
        description="Иконка настроек вместо домика и описание, которое называет причину и выход."
        pros={['с первого взгляда видно, что пусто из-за настроек']}
        cons={['ползунки рядом с «Настроить главную» повторяют одно и то же']}
      >
        <VariantFrames>
          <HomeEmpty
            icon={<SlidersHorizontalIcon />}
            title="На главной пусто"
            description="Подборки всех источников выключены. Включите те, что хотите видеть здесь."
          />
        </VariantFrames>
      </DemoSection>
      <DemoSection
        code="E4"
        title="«Начните читать»"
        description="Говорит о главной целиком: здесь будет «Продолжить чтение» и подборки. Мягче, но причина пустоты размыта."
        pros={['объясняет, что вообще бывает на главной', 'с «Все источники» — есть с чего начать']}
        cons={[
          'не говорит, что подборки выключены руками',
          'заголовок расходится с термином плана',
        ]}
      >
        <VariantFrames>
          <HomeEmpty
            icon={<BookOpenIcon />}
            title="Начните читать"
            description="Здесь появятся тайтлы, которые вы читаете, и подборки источников — включите их в настройках."
            withAllSources
          />
        </VariantFrames>
      </DemoSection>
    </Stack>
  );
}

export default EmptySection;

import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import { RESULT_APPEARANCE } from '../models';
import { FOOTER_SIZE_VARIANTS } from '../variants';
import ResultPreview from './ResultPreview';

function ResultSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="R"
        title="Итог"
        description="Выбран D5a + T5 + C1: футер с кнопкой 30 px и текстом 14 px, все заголовки 600, центрирование простого сообщения. Полоса A1, отступы 16 px, стек S2 и взаимодействие I1 сохраняются. Прежний итог и все сравнения оставлены на своих местах; выбранная комбинация отмечена ниже."
      />
      <DemoSection
        code="A1 + T2 + D2 + S2 + I1"
        title="Прежний итог: полоса, просторная карточка и действие снизу"
        description="Тон задают квадратная иконка и тонкая полоса. Отступы 16 px, заголовок подробного сообщения — 600, текст — 14 px. Кнопка всегда под текстом. На десктопе ширина 420 px, интервал 12 px; на телефоне карточки занимают доступную ширину. События открываются всей карточкой: подсветка при наведении и контур фокуса, без постоянной стрелки."
        pros={[
          'Тон заметен без яркой заливки всей карточки',
          'Действие находится в одном месте независимо от длины текста',
          'На десктопе длинные сообщения реже переносятся',
        ]}
        cons={[
          'Просторные карточки и интервалы увеличивают высоту стека на телефоне',
          'Кликабельность события до наведения не подчёркнута отдельной стрелкой',
        ]}
      >
        <ResultPreview
          appearance={RESULT_APPEARANCE}
          galleryLabel="Все тосты прежнего итога"
          modalLabel="Проверить прежний итог в модалке"
          drawerLabel="Проверить прежний итог в drawer"
        />
      </DemoSection>
      {FOOTER_SIZE_VARIANTS.map(
        ({ code, appearance, width: _width, samples: _samples, ...variant }) => (
          <DemoSection key={code} {...variant} code={`${code} + T5 + C1`}>
            <ResultPreview
              appearance={appearance}
              galleryLabel={`Все тосты: ${code} + T5 + C1`}
              modalLabel={`Проверить ${code} в модалке`}
              drawerLabel={`Проверить ${code} в drawer`}
            />
          </DemoSection>
        ),
      )}
    </Stack>
  );
}

export default ResultSection;

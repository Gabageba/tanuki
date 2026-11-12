import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import { EMAIL_LAYOUT, EMAIL_REVISION, type EmailScheme } from '../models';
import VariantGallery from './VariantGallery';

type Props = {
  scheme: EmailScheme;
  brandedFonts: boolean;
};

function ResultSection({ scheme, brandedFonts }: Props) {
  return (
    <Stack id="axis-R" gap="xs">
      <DemoSection
        code="R"
        title="Итог · E1b"
        description="Выбран E1b: карточка на нейтральном фоне, кнопка 44 px с обычным начертанием и иконкой 20 px по центру. Запасной адрес скрыт под текстом «откройте ссылку в браузере». Все пять писем показаны вместе; тема и шрифты переключаются общими настройками выше."
        pros={[
          'Карточка повторяет стиль приложения и отделяет действие от пояснений',
          'Крупная область нажатия с лёгким начертанием текста',
          'Короткая запасная ссылка не перегружает письмо токеном',
        ]}
        cons={['Кнопка выше, чем в приложении', 'Для копирования адреса нужно открыть меню ссылки']}
      >
        <VariantGallery
          code="Итог E1b"
          layout={EMAIL_LAYOUT.CARD}
          revision={EMAIL_REVISION.LARGE_ACTION}
          scheme={scheme}
          brandedFonts={brandedFonts}
        />
      </DemoSection>
    </Stack>
  );
}

export default ResultSection;

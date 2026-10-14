import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import FooterStates from '../components/FooterStates';

/** Ось B — нижняя панель на телефоне. Решено планом, здесь — для сравнения с тем, что сейчас. */
function FooterSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="B"
        title="Нижняя панель"
        description="Не развилка: план уже решил — «Главная» первой. Показана, чтобы сравнить с тем, что сейчас, и увидеть, что панель стала на кнопку длиннее."
      />
      <DemoSection
        code="B0"
        title="Как сейчас"
        description="Источники, закладки, уведомления, меню. На главной не горит ничего — источники на ней не активны."
        cons={['на главную с телефона не попасть, кроме как логотипом — а его на телефоне нет']}
      >
        <FooterStates withHome={false} />
      </DemoSection>
      <DemoSection
        code="B1"
        title="«Главная» первой"
        description="Пять кнопок: главная, источники, закладки, уведомления, меню. На / горит «Главная» с подписью, в каталоге — источник."
        pros={['главная в одно касание с любой страницы', 'на главной видно, где ты']}
        cons={['пять кнопок вместо четырёх — неактивные уже, подпись активной обрезается раньше']}
      >
        <FooterStates withHome />
      </DemoSection>
    </Stack>
  );
}

export default FooterSection;

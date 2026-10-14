import { Stack } from '@mantine/core';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import AccountMenuMock from '../components/AccountMenuMock';
import OfferActions from '../components/OfferActions';
import OfferToast from '../components/OfferToast';

/** T — новая версия service worker готова. */
function UpdateSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Доступно обновление"
        description="Новая версия приложения скачалась и ждёт перезагрузки. В читалке ничего не показывается до выхода из неё; пока качается глава, обновление применится после её конца."
      />
      <DemoSection
        code="T1"
        title="Тост с кнопкой"
        description="Тост в виде тостов уведомлений: «Доступно обновление», что будет при перезагрузке, «Обновить приложение» и «Не сейчас». Не закрывается сам."
        pros={['Заметно сразу', 'Вид уже принят для тостов']}
        cons={[
          'Прерывает, если версии выходят часто',
          'После «Не сейчас» вернуться к нему негде — нужен ещё и пункт меню',
        ]}
      >
        <OfferToast
          icon={<ArrowsClockwiseIcon size={18} />}
          color="gray"
          title="Доступно обновление"
          detail="Приложение перезагрузится, загрузки продолжатся с той же страницы"
          actions={<OfferActions label="Обновить приложение" icon={<ArrowsClockwiseIcon />} />}
        />
      </DemoSection>
      <DemoSection
        code="T2"
        title="Точка на аватаре и пункт меню"
        description="Ничего не всплывает: на аватаре точка, в меню — «Обновить приложение» с такой же точкой. Обновление применится и само при следующем запуске."
        pros={['Не прерывает никогда', 'Всегда есть куда вернуться']}
        cons={[
          'Могут не заметить неделями',
          'Точка на аватаре спорит с точками закладок и уведомлений',
        ]}
      >
        <AccountMenuMock withUpdate />
      </DemoSection>
    </Stack>
  );
}

export default UpdateSection;

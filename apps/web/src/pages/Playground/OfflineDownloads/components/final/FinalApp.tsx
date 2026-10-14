import { Group, Stack, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, CheckIcon, DeviceMobileIcon } from '@phosphor-icons/react';
import AccountMenuMock from '../AccountMenuMock';
import OfferActions from '../OfferActions';
import OfferToast from '../OfferToast';

/** Итог по приложению: тост обновления один раз и пункт меню с точкой, пока оно не применено (на
 *  аватаре точки нет); установка тостом и пунктом меню; подсказка iOS тостом при первом скачивании.
 *  В тостах кнопки — «Обновить» и «Установить»: объект уже назван заголовком тоста. */
function FinalApp() {
  return (
    <Group align="flex-start" gap="xl">
      <Stack gap="md">
        <Text fz={12} c="dimmed" ff="monospace">
          Тосты
        </Text>
        <OfferToast
          icon={<ArrowsClockwiseIcon size={18} />}
          color="gray"
          title="Доступно обновление"
          detail="Приложение перезагрузится, загрузки продолжатся с той же страницы"
          actions={<OfferActions label="Обновить" icon={<ArrowsClockwiseIcon />} />}
        />
        <OfferToast
          icon={<DeviceMobileIcon size={18} />}
          color="gray"
          title="Установить Tanuki"
          detail="Откроется отдельным окном и быстрее запустится без сети"
          actions={<OfferActions label="Установить" icon={<DeviceMobileIcon />} />}
        />
        <OfferToast
          icon={<DeviceMobileIcon size={18} />}
          color="gray"
          title="Установите Tanuki на экран Домой"
          detail="Без установки Safari удаляет скачанное, если не открывать сайт 7 дней. «Поделиться» → «На экран Домой»."
          actions={<OfferActions label="Понятно" icon={<CheckIcon />} />}
        />
      </Stack>
      <Stack gap="md">
        <Text fz={12} c="dimmed" ff="monospace">
          Меню аватара, обновление ждёт — на аватаре точки нет
        </Text>
        <AccountMenuMock withUpdate isAvatarDotHidden />
      </Stack>
    </Group>
  );
}

export default FinalApp;

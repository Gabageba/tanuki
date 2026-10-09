import { useState } from 'react';
import { Group, SegmentedControl, Select, SimpleGrid, Stack } from '@mantine/core';
import { DeviceMobileIcon } from '@phosphor-icons/react';
import AxisHeading from '../components/AxisHeading';
import Frames from '../components/Frames';
import SettingsCardsLayout from '../components/SettingsCardsLayout';
import SettingsDeviceBlock from '../components/SettingsDeviceBlock';
import SettingsRowsLayout from '../components/SettingsRowsLayout';
import SettingsTableLayout from '../components/SettingsTableLayout';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import { getRoleLabel } from '../lib';
import { DEVICE_STATE, MOCK_ROLE, type DeviceState, type MockRole } from '../models';

const ROLES = [MOCK_ROLE.USER, MOCK_ROLE.MODERATOR, MOCK_ROLE.ADMIN];

const DEVICE_STATES = [
  { value: DEVICE_STATE.UNSUPPORTED, label: 'Браузер без push' },
  { value: DEVICE_STATE.IOS_NOT_INSTALLED, label: 'iOS вне установленного приложения' },
  { value: DEVICE_STATE.DENIED, label: 'Запрещено в браузере' },
  { value: DEVICE_STATE.OFF, label: 'Выключено' },
  { value: DEVICE_STATE.ON, label: 'Включено' },
  { value: DEVICE_STATE.EXPIRED, label: 'Подписка устарела' },
];

const isRole = (value: string): value is MockRole => ROLES.some((role) => role === value);
const isDeviceState = (value: string | null): value is DeviceState =>
  DEVICE_STATES.some((state) => state.value === value);

/** Оси U и S: вкладка «Уведомления» в настройках. */
function SettingsSection() {
  const [role, setRole] = useState<MockRole>(MOCK_ROLE.ADMIN);
  const [deviceState, setDeviceState] = useState<DeviceState>(DEVICE_STATE.OFF);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Вкладка «Уведомления» в настройках"
        description="Блок «Это устройство» один, его состояния — ниже. Меняется раскладка категорий. Тумблер устройства действует на этом устройстве, категории — на все."
      />
      <SandboxOnly>
        <Group gap="md">
          <SegmentedControl
            value={role}
            onChange={(next) => isRole(next) && setRole(next)}
            data={ROLES.map((item) => ({ value: item, label: getRoleLabel(item) }))}
          />
          <Select
            value={deviceState}
            onChange={(next) => isDeviceState(next) && setDeviceState(next)}
            data={DEVICE_STATES}
            allowDeselect={false}
            aria-label="Состояние устройства"
            leftSection={<DeviceMobileIcon size={16} />}
          />
        </Group>
      </SandboxOnly>
      <DemoSection
        code="U"
        title="Блок устройства: все состояния"
        description="Нет поддержки, iOS вне установленного приложения и запрет браузера — тумблер недоступен и объясняет почему. Устаревшая подписка — тумблер выключен, предлагает включить заново."
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {DEVICE_STATES.map(({ value }) => (
            <SettingsDeviceBlock key={value} state={value} />
          ))}
        </SimpleGrid>
      </DemoSection>
      <DemoSection
        code="S1"
        title="Строки"
        description="Подзаголовки и плоские строки с тумблерами."
        pros={['Привычно для настроек, помещается в 375 px']}
        cons={['У админа длинная вертикаль']}
      >
        <Frames>
          <SettingsRowsLayout role={role} deviceState={deviceState} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="S2"
        title="Две карточки"
        description="Отдельно устройство, отдельно категории."
        pros={['Разведены устройство и аккаунт']}
        cons={['Больше рамок, чем нужно']}
      >
        <Frames>
          <SettingsCardsLayout role={role} deviceState={deviceState} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="S3"
        title="Таблица категорий"
        description="Столбец «Push»; на телефоне таблица скроллится."
        pros={['Расширяется на другие каналы']}
        cons={['Канал пока один, таблица избыточна', 'На телефоне неудобна']}
      >
        <Frames>
          <SettingsTableLayout role={role} deviceState={deviceState} />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default SettingsSection;

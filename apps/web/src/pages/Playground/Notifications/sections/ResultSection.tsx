import { useState } from 'react';
import { Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { DeviceMobileIcon } from '@phosphor-icons/react';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import NavBarMock from '../components/NavBarMock';
import PushBanner from '../components/PushBanner';
import SettingsGroupedLayout from '../components/SettingsGroupedLayout';
import ToastStack from '../components/ToastStack';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import { getRoleLabel } from '../lib';
import {
  BADGE,
  COUNTER,
  DEVICE_STATE,
  DISMISS,
  EMPTY,
  FILTER,
  LEADING,
  MOCK_ROLE,
  PAGINATION,
  PUSH_LAYOUT,
  ROWS,
  type DeviceState,
  type MockRole,
} from '../models';

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

/** Итог: выбранная комбинация целиком — лента, бейдж, тосты, вкладка настроек. */
function ResultSection() {
  const [role, setRole] = useState<MockRole>(MOCK_ROLE.ADMIN);
  const [deviceState, setDeviceState] = useState<DeviceState>(DEVICE_STATE.OFF);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="★"
        title="Итог"
        description="R2 + L1 + N1 + B2 + F1 + P (бесконечная прокрутка) + E3 без ссылки + T1 + D1 + Q1 (до 3) + K4 в виде M3 + X3 + один блок стандартных настроек."
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
        code="★ Лента"
        title="Страница /notifications"
        description="Строки — карточки с собственным фоном, слева обложка у новых глав и квадратная иконка по типу у остальных событий, число глав словами. Фильтр — CompactMultiSelect. Список подгружается при прокрутке до конца. Первая строка — акцентная карточка с предложением включить push (M3, пока человек не нажал «Не сейчас»); справа на строке и у кнопки над списком — корзина (X3); пустая лента — с описанием, но без ссылки, а при фильтре — «В этой категории ничего нет» со сбросом."
      >
        <Stack gap="xl">
          <Frames>
            <FeedPageMock
              items={undefined}
              rows={ROWS.CARDS}
              leading={LEADING.COVER_AND_ICON}
              counter={COUNTER.WORDS}
              dismiss={DISMISS.TRASH}
              filter={FILTER.SELECT}
              pagination={PAGINATION.INFINITE}
              empty={EMPTY.BY_REASON_NO_LINK}
              top={<PushBanner state="ask" layout={PUSH_LAYOUT.CARD} />}
            />
          </Frames>
          <Text fz="sm" c="dimmed">
            Пустая лента с предложением push:
          </Text>
          <Frames desktopOnly>
            <FeedPageMock
              items={[]}
              rows={ROWS.CARDS}
              leading={LEADING.COVER_AND_ICON}
              counter={COUNTER.WORDS}
              dismiss={DISMISS.TRASH}
              filter={FILTER.SELECT}
              pagination={PAGINATION.INFINITE}
              empty={EMPTY.BY_REASON_NO_LINK}
              top={<PushBanner state="ask" layout={PUSH_LAYOUT.CARD} />}
            />
          </Frames>
        </Stack>
      </DemoSection>
      <DemoSection
        code="★ Бейдж"
        title="Колокольчик с точкой"
        description="Та же точка 8 px, что на закладках, без числа."
      >
        <NavBarMock
          variant={BADGE.DOT}
          count={3}
          hasBookmarkDot
          label="3 непрочитанных, в закладках есть новое"
        />
      </DemoSection>
      <DemoSection
        code="★ Тосты"
        title="Тост о важном событии"
        description="Весь тост кликабелен и ведёт к цели, тон по категории (безопасность 10 с, источник лёг 8 с, ожил и инвайты 5 с). На экране не больше трёх: приходит четвёртый — самый старый закрывается."
      >
        <Frames>
          <ToastStack />
        </Frames>
      </DemoSection>
      <DemoSection
        code="★ Настройки"
        title="Вкладка «Уведомления»"
        description="Один стандартный блок настроек (GroupedList), как во вкладке «Общие»: сверху тумблер «на этом устройстве», ниже тумблеры категорий. У модератора и админа добавляется «Администрирование»."
      >
        <Frames>
          <SettingsGroupedLayout role={role} deviceState={deviceState} />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default ResultSection;

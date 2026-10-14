import { Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { DeviceMobileIcon } from '@phosphor-icons/react';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import AccountMenuMock from '../components/AccountMenuMock';
import OfferActions from '../components/OfferActions';
import OfferAlert from '../components/OfferAlert';
import OfferToast from '../components/OfferToast';
import ReaderEndMock from '../components/ReaderEndMock';

const TITLE = 'Установить Tanuki';
const DETAIL = 'Откроется отдельным окном и быстрее запустится без сети';

/** I — предложение установки (Chromium) и пункт «Установить приложение» в меню. */
function InstallSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="I"
        title="Установка"
        description="Chromium: системное предложение отложено и показывается после второй дочитанной главы. Пункт «Установить приложение» в меню аватара — в обоих вариантах, пока приложение не установлено."
      />
      <AccountMenuMock />
      <DemoSection
        code="I1"
        title="Тост"
        description="После второй дочитанной главы — тост с «Установить приложение» и «Не сейчас»."
        pros={[
          'Появляется в момент, когда польза уже понятна',
          'Одно место показа, простая логика',
        ]}
        cons={['Если смахнуть, второй раз не увидят — остаётся только пункт меню']}
      >
        <OfferToast
          icon={<DeviceMobileIcon size={18} />}
          color="gray"
          title={TITLE}
          detail={DETAIL}
          actions={<OfferActions label="Установить приложение" icon={<DeviceMobileIcon />} />}
        />
      </DemoSection>
      <DemoSection
        code="I2"
        title="Блок на странице"
        description="Блок в виде предложения push (M3): в конце второй дочитанной главы и вверху «Загрузок», пока не нажато «Не сейчас»."
        pros={['Стоит там, где думают об офлайне', 'Не исчезает сам']}
        cons={[
          'Две точки показа — больше логики',
          'В читалке светлый блок на чёрном фоне выбивается',
        ]}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" maw={1100}>
          <Stack gap={6}>
            <Text fz={12} c="dimmed" ff="monospace">
              Конец главы
            </Text>
            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
              <Stack gap={0}>
                <ReaderEndMock withDownloadsLink={false} />
                <Group p="sm" bg="#000">
                  <OfferAlert
                    icon={<DeviceMobileIcon />}
                    title={TITLE}
                    description={DETAIL}
                    actions={
                      <OfferActions
                        label="Установить приложение"
                        icon={<DeviceMobileIcon />}
                        isFull
                      />
                    }
                  />
                </Group>
              </Stack>
            </Paper>
          </Stack>
          <Stack gap={6}>
            <Text fz={12} c="dimmed" ff="monospace">
              Вверху «Загрузок»
            </Text>
            <OfferAlert
              icon={<DeviceMobileIcon />}
              title={TITLE}
              description={DETAIL}
              actions={
                <OfferActions label="Установить приложение" icon={<DeviceMobileIcon />} isFull />
              }
            />
          </Stack>
        </SimpleGrid>
      </DemoSection>
    </Stack>
  );
}

export default InstallSection;

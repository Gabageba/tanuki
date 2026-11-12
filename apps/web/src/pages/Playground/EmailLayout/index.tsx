import { useState } from 'react';
import { Checkbox, Divider, Group, Select, Stack, Text, Title } from '@mantine/core';
import { PaletteIcon } from '@phosphor-icons/react';
import { COLOR_SCHEME } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import SectionNav from '../components/SectionNav';
import VariantGallery from './components/VariantGallery';
import { SCHEME_OPTIONS, SECTION_GROUPS, VARIANTS, type EmailScheme } from './models';

function PlaygroundEmailLayout() {
  const [scheme, setScheme] = useState<EmailScheme>(COLOR_SCHEME.LIGHT);
  const [brandedFonts, setBrandedFonts] = useState(true);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Письма Tanuki</Title>
      </Group>
      <Stack gap="xs" maw={880}>
        <Text fz="sm" c="dimmed">
          В конце страницы — доработка выбранной карточки E1: E1a с кнопкой 36 px и E1b с кнопкой 44
          px. В обоих обычное начертание текста, иконка по центру и короткая запасная ссылка. Первые
          E0–E3 сохранены на прежних местах. У каждого варианта все пять писем: подтверждение почты,
          сброс пароля, код смены адреса, уведомление о смене и удаление аккаунта.
        </Text>
        <Text fz="sm" c="dimmed">
          Рядом показаны компьютер и телефон; на узком экране рамки сужаются до доступной ширины.
          Светлая основа и тёмная адаптация переключаются независимо от темы песочницы. Это
          задуманный вид HTML в браузере: автоматическое изменение цветов почтовиками здесь не
          имитируется. Поддержку тёмной темы и шрифтов нужно будет проверять в самих клиентах.
        </Text>
        <Text fz="sm" c="dimmed">
          Всё без пометки «Только песочница» показано так, как предлагается для реализации. Темы и
          превью во входящих подписаны над письмами. Ссылки демонстрационные, переходы отключены;
          код можно выделить и скопировать. Текущие письма API не меняются.
        </Text>
        <Text fz="sm" c="dimmed">
          Высота кнопок 36 и 44 px — для одной строки. На узком экране длинная подпись переносится,
          кнопка растёт по содержимому. Код показан одной строкой из шести цифр; кнопки копирования
          в письме нет, поскольку почтовые клиенты не обеспечивают её работу.
        </Text>
      </Stack>
      <SandboxOnly>
        <Group gap="lg" align="center">
          <Select
            aria-label="Тема макетов писем"
            leftSection={<PaletteIcon size={18} />}
            data={SCHEME_OPTIONS}
            value={scheme}
            allowDeselect={false}
            w={230}
            onChange={(value) => {
              if (value === COLOR_SCHEME.LIGHT || value === COLOR_SCHEME.DARK) {
                setScheme(value);
              }
            }}
          />
          <Checkbox
            label="Показать фирменные шрифты"
            checked={brandedFonts}
            onChange={(event) => setBrandedFonts(event.currentTarget.checked)}
          />
        </Group>
        <Text fz="xs" c="dimmed" mt="xs" maw={700}>
          Без галочки — Arial и системный моноширинный шрифт. E0 всегда сохраняет исходное
          оформление.
        </Text>
      </SandboxOnly>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          {VARIANTS.map(({ layout, revision, ...variant }) => (
            <Stack key={variant.code} id={`axis-${variant.code}`} gap="xs">
              <DemoSection {...variant}>
                <VariantGallery
                  code={variant.code}
                  layout={layout}
                  revision={revision}
                  scheme={scheme}
                  brandedFonts={brandedFonts}
                />
              </DemoSection>
            </Stack>
          ))}
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundEmailLayout;

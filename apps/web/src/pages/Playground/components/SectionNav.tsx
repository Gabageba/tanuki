import { Box, NavLink, Stack, Text, ThemeIcon } from '@mantine/core';
import { useScrollSpy, useWindowScroll } from '@mantine/hooks';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';

const OFFSET = HEADER_HEIGHT + 16;

export type SectionNavAxis = {
  letter: string;
  title: string;
};

export type SectionNavGroup = {
  title: string;
  axes: SectionNavAxis[];
};

type Props = {
  /** Разделы страницы в порядке, как на ней, по смысловым группам. */
  groups: SectionNavGroup[];
};

/** Оглавление слева для страницы песочницы: разделы по группам, у каждого буква оси в плашке. Активный раздел
 *  (по прокрутке) подсвечен, клик плавно прокручивает к нему. Прилипает под шапкой приложения; на
 *  узком экране скрыто. */
function SectionNav({ groups }: Props) {
  const { data } = useScrollSpy({ selector: '[id^="axis-"]', offset: OFFSET });
  // Mantine выбирает ближайший заголовок — на длинном разделе это уже следующий.
  // Обновляем выбор при каждой прокрутке, даже пока ближайший заголовок не меняется.
  useWindowScroll();
  const activeId =
    data.reduce<string | undefined>(
      (current, heading) =>
        heading.getNode().getBoundingClientRect().top <= OFFSET + 1 ? heading.id : current,
      undefined,
    ) ?? data[0]?.id;

  const scrollTo = (letter: string) => {
    const element = document.getElementById(`axis-${letter}`);
    if (!element) {
      return;
    }
    const top = element.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <Box
      component="nav"
      visibleFrom="md"
      w={250}
      flex="none"
      pos="sticky"
      top={OFFSET}
      mah={`calc(100vh - ${OFFSET + 16}px)`}
      style={{ overflowY: 'auto', alignSelf: 'flex-start' }}
    >
      <Stack gap="lg">
        {groups.map(({ title, axes }) => (
          <Stack key={title} gap={2}>
            <Text fz="sm" fw={700} px="sm" pb={4}>
              {title}
            </Text>
            {axes.map(({ letter, title: axisTitle }) => {
              const isActive = activeId === `axis-${letter}`;

              return (
                <NavLink
                  key={letter}
                  active={isActive}
                  variant="light"
                  label={axisTitle}
                  leftSection={
                    <ThemeIcon
                      size={24}
                      radius="sm"
                      variant={isActive ? 'filled' : 'default'}
                      ff="monospace"
                      fw={700}
                      fz="xs"
                    >
                      {letter}
                    </ThemeIcon>
                  }
                  onClick={() => scrollTo(letter)}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default SectionNav;

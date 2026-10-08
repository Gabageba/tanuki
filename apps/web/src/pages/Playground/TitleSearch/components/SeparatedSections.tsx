import { Children, Fragment, type ReactNode } from 'react';
import { Box, Divider, Stack } from '@mantine/core';
import { SECTION_SEPARATOR, type SectionSeparator } from '../models';

type Props = {
  separator: SectionSeparator;
  children: ReactNode;
};

/** Секции источников подряд; чем они разделены — по оси R. */
function SeparatedSections({ separator, children }: Props) {
  const sections = Children.toArray(children);

  if (separator === SECTION_SEPARATOR.SURFACE) {
    return (
      <Stack gap="md">
        {sections.map((section, index) => (
          <Box key={index} p="md" bdrs="md" bg="var(--tanuki-color-surface)">
            {section}
          </Box>
        ))}
      </Stack>
    );
  }

  const isDivided =
    separator === SECTION_SEPARATOR.DIVIDER || separator === SECTION_SEPARATOR.DIVIDER_WIDE;

  return (
    <Stack gap={separator === SECTION_SEPARATOR.DIVIDER ? 'lg' : 'xl'}>
      {sections.map((section, index) => (
        <Fragment key={index}>
          {isDivided && index > 0 && <Divider />}
          {section}
        </Fragment>
      ))}
    </Stack>
  );
}

export default SeparatedSections;

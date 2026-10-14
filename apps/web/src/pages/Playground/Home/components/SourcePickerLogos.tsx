import { Box, Group, Scroller, Tooltip, UnstyledButton } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
};

/** P3c — круглые логотипы без подписей, как «истории»: выбранный — в акцентном кольце, название —
 *  в тултипе. */
function SourcePickerLogos({ sources, activeId, onChange }: Props) {
  return (
    <Scroller>
      <Group gap="sm" wrap="nowrap" py={4}>
        {sources.map((source) => {
          const isActive = source.id === activeId;
          return (
            <Tooltip key={source.id} label={source.title}>
              <UnstyledButton
                onClick={() => onChange(source.id)}
                aria-label={source.title}
                aria-pressed={isActive}
              >
                <Box
                  p={3}
                  bdrs="50%"
                  style={{
                    border: `2px solid ${isActive ? 'var(--mantine-primary-color-filled)' : 'transparent'}`,
                  }}
                >
                  <SourceIcon id={source.id} title={source.title} size={44} radius="xl" />
                </Box>
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Group>
    </Scroller>
  );
}

export default SourcePickerLogos;

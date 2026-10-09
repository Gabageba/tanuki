import { Checkbox, Group, Stack, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { MOCK_SEARCHABLE_SOURCES } from '../mocks';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

/** «Источники» чекбоксами, с иконками — их узнают по логотипу быстрее, чем по названию. */
function SourceCheckList({ value, onChange }: Props) {
  return (
    <Checkbox.Group value={value} onChange={onChange}>
      <Stack gap={8}>
        {MOCK_SEARCHABLE_SOURCES.map((source) => (
          <Checkbox
            key={source.id}
            value={source.id}
            label={
              <Group gap={8} wrap="nowrap">
                <SourceIcon id={source.id} title={source.title} size={18} />
                <Text span fz="sm">
                  {source.title}
                </Text>
              </Group>
            }
          />
        ))}
      </Stack>
    </Checkbox.Group>
  );
}

export default SourceCheckList;

import { useState } from 'react';
import { AspectRatio, Box, Button, Center, Overlay, Stack } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict, type TitleMatch } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import useLongPress from '@/shared/hooks/useLongPress';

type Props = {
  match: TitleMatch;
  isPending: boolean;
  onSave: (verdict: TitleLinkVerdict, onSaved: () => void) => void;
};

/** Копия текущего TitleMatchCard: русские тексты и локальное сохранение без API. */
function CurrentMatchCard({ match, isPending, onSave }: Props) {
  const [opened, setOpened] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpened(false));
  const longPressHandlers = useLongPress(() => setOpened(true));

  return (
    <Box ref={ref} w={170} pos="relative" {...longPressHandlers}>
      <AspectRatio ratio={3 / 4}>
        {opened && (
          <Overlay backgroundOpacity={0.85} radius="md" blur={6}>
            <Center h="100%" w="100%">
              <Stack gap={8} p="xs" w="100%">
                <Button
                  w="100%"
                  color="moss"
                  leftSection={<ThumbsUpIcon />}
                  loading={isPending}
                  onClick={() => onSave(TITLE_LINK_VERDICT.CONFIRMED, () => setOpened(false))}
                >
                  Это он
                </Button>
                <Button
                  w="100%"
                  color="crimson"
                  leftSection={<ThumbsDownIcon />}
                  loading={isPending}
                  onClick={() => onSave(TITLE_LINK_VERDICT.REJECTED, () => setOpened(false))}
                >
                  Не он
                </Button>
              </Stack>
            </Center>
          </Overlay>
        )}
      </AspectRatio>
      <SourceTitleCard title={match.title} showSource />
    </Box>
  );
}

export default CurrentMatchCard;

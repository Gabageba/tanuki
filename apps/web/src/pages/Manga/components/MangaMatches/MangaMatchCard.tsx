import { useState } from 'react';
import { AspectRatio, Box, Button, Center, Overlay, Stack } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import MangaCard from '@/entities/manga/card/MangaCard';
import { MANGA_LINK_VERDICT, type MangaLinkVerdict, type MangaMatch } from '@tanuki/contracts';
import useLongPress from '@/shared/hooks/useLongPress';
import type useSetMangaLink from '../../hooks/useSetMangaLink';

type Props = {
  match: MangaMatch;
  mutateMangaLink: ReturnType<typeof useSetMangaLink>['mutate'];
  isMangaLinkPending: boolean;
};

function MangaMatchCard({ match, mutateMangaLink, isMangaLinkPending }: Props) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpened(false));
  const longPressHandlers = useLongPress(() => setOpened(true));

  const handleVerdict = (verdict: MangaLinkVerdict) =>
    mutateMangaLink({ targetId: match.manga.id, verdict }, { onSuccess: () => setOpened(false) });

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
                  loading={isMangaLinkPending}
                  onClick={() => handleVerdict(MANGA_LINK_VERDICT.CONFIRMED)}
                >
                  {t('thisIsIt')}
                </Button>
                <Button
                  w="100%"
                  color="crimson"
                  leftSection={<ThumbsDownIcon />}
                  loading={isMangaLinkPending}
                  onClick={() => handleVerdict(MANGA_LINK_VERDICT.REJECTED)}
                >
                  {t('notIt')}
                </Button>
              </Stack>
            </Center>
          </Overlay>
        )}
      </AspectRatio>
      <MangaCard manga={match.manga} showSource />
    </Box>
  );
}

export default MangaMatchCard;

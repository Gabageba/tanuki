import { useState } from 'react';
import { AspectRatio, Box, Button, Center, Overlay, Stack } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import TitleCard from '@/entities/title/card/TitleCard';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict, type TitleMatch } from '@tanuki/contracts';
import useLongPress from '@/shared/hooks/useLongPress';
import type useSetTitleLink from '../../hooks/useSetTitleLink';

type Props = {
  match: TitleMatch;
  mutateTitleLink: ReturnType<typeof useSetTitleLink>['mutate'];
  isTitleLinkPending: boolean;
  isStaff: boolean;
};

function TitleMatchCard({ match, mutateTitleLink, isTitleLinkPending, isStaff }: Props) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpened(false));
  const longPressHandlers = useLongPress(() => setOpened(true));

  const handleVerdict = (verdict: TitleLinkVerdict) =>
    mutateTitleLink({ targetId: match.title.id, verdict }, { onSuccess: () => setOpened(false) });

  return (
    <Box ref={ref} w={170} pos="relative" {...(isStaff ? longPressHandlers : {})}>
      <AspectRatio ratio={3 / 4}>
        {isStaff && opened && (
          <Overlay backgroundOpacity={0.85} radius="md" blur={6}>
            <Center h="100%" w="100%">
              <Stack gap={8} p="xs" w="100%">
                <Button
                  w="100%"
                  color="moss"
                  leftSection={<ThumbsUpIcon />}
                  loading={isTitleLinkPending}
                  onClick={() => handleVerdict(TITLE_LINK_VERDICT.CONFIRMED)}
                >
                  {t('thisIsIt')}
                </Button>
                <Button
                  w="100%"
                  color="crimson"
                  leftSection={<ThumbsDownIcon />}
                  loading={isTitleLinkPending}
                  onClick={() => handleVerdict(TITLE_LINK_VERDICT.REJECTED)}
                >
                  {t('notIt')}
                </Button>
              </Stack>
            </Center>
          </Overlay>
        )}
      </AspectRatio>
      <TitleCard title={match.title} showSource />
    </Box>
  );
}

export default TitleMatchCard;

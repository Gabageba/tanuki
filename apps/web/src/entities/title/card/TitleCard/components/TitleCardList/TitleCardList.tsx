import { Box, Card, Group, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardCover from '../TitleCardCover/TitleCardCover';
import TitleCardMetaRow from '../TitleCardMetaRow';
import TitleCardName from '../TitleCardName/TitleCardName';
import TitleCardDescription from './TitleCardDescription';
import { getTitleCardPath } from '../../lib';
import type { TitleCardViewContent } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardViewContent;

function TitleCardList({ data, meta, actions, footer }: Props) {
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.LIST}
      className={styles.card}
      pos="relative"
      p={0}
      c="inherit"
      withBorder
    >
      <Link to={getTitleCardPath(data.id)} aria-label={data.name} className={styles.link} />
      <Group align="stretch" wrap="nowrap" gap={0}>
        <TitleCardCover data={data} />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack className={styles.heading} gap={8} flex={1}>
            <TitleCardMetaRow meta={meta} actions={actions} contentRating={data.contentRating} />
            <TitleCardName data={data} />
            <TitleCardDescription description={data.description} />
          </Stack>
          <Box data-card-footer className={styles.footer}>
            {footer}
          </Box>
        </Stack>
      </Group>
    </Card>
  );
}

export default TitleCardList;

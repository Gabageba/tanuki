import { Card, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardCover from '../TitleCardCover/TitleCardCover';
import TitleCardMetaRow from '../TitleCardMetaRow';
import TitleCardName from '../TitleCardName/TitleCardName';
import { getTitleCardPath } from '../../lib';
import type { TitleCardViewContent } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardViewContent;

function TitleCardGrid({ data, showSource, meta, actions }: Props) {
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.GRID}
      className={styles.card}
      pos="relative"
      p={0}
      c="inherit"
      bg="transparent"
      bdrs="var(--mantine-radius-md) var(--mantine-radius-md) 0 0"
    >
      <Link to={getTitleCardPath(data.id)} aria-label={data.name} className={styles.link} />
      <Stack gap={8}>
        <TitleCardCover data={data} showSource={showSource} />
        <Stack className={styles.heading} gap={4}>
          <TitleCardMetaRow meta={meta} contentRating={data.contentRating} actions={actions} />
          <TitleCardName data={data} />
        </Stack>
      </Stack>
    </Card>
  );
}

export default TitleCardGrid;

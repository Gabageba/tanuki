import { useId } from 'react';
import { Box, Card, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardName from '../TitleCardName/TitleCardName';
import TitleCardDescription from '../TitleCardList/TitleCardDescription';
import TitleCardMetaRow from '../TitleCardMetaRow';
import { getTitleCardPath } from '../../lib';
import type { TitleCardViewContent } from '../../models';
import TitleCardFolderTag from '../TitleCardFolderTag';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardViewContent;

function TitleCardCoverless({ data, meta, footer, actions }: Props) {
  const folderId = useId();
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.COVERLESS}
      className={styles.card}
      pos="relative"
      p="sm"
      c="inherit"
      withBorder
    >
      <Link
        to={getTitleCardPath(data.id)}
        aria-label={data.name}
        aria-describedby={data.bookmarkFolder ? folderId : undefined}
        className={styles.link}
      />
      <Stack gap={8} flex={1}>
        <Stack className={styles.heading} gap={8}>
          <TitleCardMetaRow
            meta={meta}
            contentRating={data.contentRating}
            actions={actions}
            markers={
              <TitleCardFolderTag
                folder={data.bookmarkFolder}
                to={getTitleCardPath(data.id)}
                id={folderId}
              />
            }
          />
          <Box miw={0}>
            <TitleCardName data={data} lines={2} />
          </Box>
        </Stack>
        <TitleCardDescription description={data.description} lines={2} />
        <Box className={styles.footer} data-card-footer mt="auto">
          {footer}
        </Box>
      </Stack>
    </Card>
  );
}

export default TitleCardCoverless;

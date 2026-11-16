import { useState } from 'react';
import { Loader, Menu, UnstyledButton } from '@mantine/core';
import { ArrowSquareOutIcon, ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import TapReviewCard from './TapReviewCard';
import styles from './TapReviewCard.module.scss';

type Props = { index: number; review: ReturnType<typeof useComparison> };

function TapReviewCardMenu({ index, review }: Props) {
  const [opened, setOpened] = useState(false);
  const match = MATCHES[index]!;
  const isPending = review.pendingVerdict !== null;
  const isSaving = review.pendingIndex === index;
  const verdict = review.verdicts[match.title.id];

  return (
    <Menu
      opened={opened}
      onChange={(value) => {
        if (!isPending) setOpened(value);
      }}
      width={220}
      position="bottom-start"
      closeOnItemClick={false}
      withinPortal
    >
      <TapReviewCard index={index} selected={opened}>
        <Menu.Target>
          <UnstyledButton
            pos="absolute"
            inset={0}
            w="100%"
            h="100%"
            className={styles.trigger}
            aria-label={`Проверить связь «${match.title.name}»`}
            aria-busy={isSaving}
            disabled={isPending}
          />
        </Menu.Target>
      </TapReviewCard>
      <Menu.Dropdown>
        <Menu.Label>{match.title.name}</Menu.Label>
        <Menu.Item
          leftSection={
            isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED ? (
              <Loader size={16} />
            ) : (
              <ThumbsUpIcon />
            )
          }
          disabled={isPending || verdict === TITLE_LINK_VERDICT.CONFIRMED}
          onClick={() => review.save(TITLE_LINK_VERDICT.CONFIRMED, index, () => setOpened(false))}
        >
          Это он
        </Menu.Item>
        <Menu.Item
          leftSection={
            isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.REJECTED ? (
              <Loader size={16} />
            ) : (
              <ThumbsDownIcon />
            )
          }
          disabled={isPending}
          onClick={() => review.save(TITLE_LINK_VERDICT.REJECTED, index, () => setOpened(false))}
        >
          Не он
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          component={Link}
          to={getTitleCardPath(match.title.id)}
          leftSection={<ArrowSquareOutIcon />}
          disabled={isPending}
        >
          Открыть тайтл
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default TapReviewCardMenu;

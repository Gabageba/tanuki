import { useState } from 'react';
import { ActionIcon, Button, Menu } from '@mantine/core';
import {
  CaretDownIcon,
  DotsThreeIcon,
  CheckSquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';

type Props = {
  review: ReturnType<typeof useComparison>;
  index: number;
  iconOnly?: boolean;
};

function QuickVerdictMenu({ review, index, iconOnly = false }: Props) {
  const [opened, setOpened] = useState(false);
  const match = MATCHES[index]!;
  const isPending = review.pendingVerdict !== null;

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      width={iconOnly ? 180 : 'target'}
      withinPortal
    >
      <Menu.Target>
        {iconOnly ? (
          <ActionIcon
            size={36}
            variant="default"
            aria-label={`Проверить связь «${match.title.name}»`}
            loading={review.pendingIndex === index}
            disabled={isPending}
          >
            <DotsThreeIcon size={24} />
          </ActionIcon>
        ) : (
          <Button
            size="xs"
            variant="default"
            fullWidth
            leftSection={<CheckSquareIcon size={14} />}
            rightSection={<CaretDownIcon size={14} />}
            loading={review.pendingIndex === index}
            disabled={isPending}
            aria-label={`Проверить связь «${match.title.name}»`}
          >
            Проверить связь
          </Button>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<ThumbsUpIcon />}
          disabled={isPending || review.verdicts[match.title.id] === TITLE_LINK_VERDICT.CONFIRMED}
          onClick={() => review.save(TITLE_LINK_VERDICT.CONFIRMED, index)}
        >
          Это он
        </Menu.Item>
        <Menu.Item
          leftSection={<ThumbsDownIcon />}
          disabled={isPending}
          onClick={() => review.save(TITLE_LINK_VERDICT.REJECTED, index)}
        >
          Не он
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default QuickVerdictMenu;

import { ActionIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import { generatePath, Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  titleId: string;
  chapterId: string | null;
  icon: ReactNode;
};

function ReaderNavigateButton({ icon, titleId, chapterId }: Props) {
  if (!chapterId) {
    return (
      <ActionIcon size="lg" variant="default" disabled>
        {icon}
      </ActionIcon>
    );
  }

  return (
    <ActionIcon
      component={Link}
      to={generatePath(ROUTE_PATHS.READER, { titleId, chapterId })}
      size="lg"
      variant="subtle"
      color="gray"
    >
      {icon}
    </ActionIcon>
  );
}

export default ReaderNavigateButton;

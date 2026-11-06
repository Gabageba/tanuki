import { Menu } from '@mantine/core';
import { Link } from 'react-router';
import type { TitleCardAction } from '../models';

type Props = Omit<TitleCardAction, 'id' | 'group'>;

function TitleCardActionItem({ to, ...props }: Props) {
  if (to !== undefined) {
    return <Menu.Item {...props} component={Link} to={to} />;
  }

  return <Menu.Item {...props} />;
}

export default TitleCardActionItem;

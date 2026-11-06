import { ActionIcon, Menu } from '@mantine/core';
import { DotsThreeIcon } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TITLE_CARD_ACTION_ICON_SIZE,
  TITLE_CARD_ACTION_SIZE,
  type TitleCardAction,
} from '../models';
import TitleCardActionItem from './TitleCardActionItem';

type Props = {
  actions: TitleCardAction[];
};

function TitleCardActions({ actions }: Props) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size={TITLE_CARD_ACTION_SIZE}
          aria-label={t('titleActions')}
        >
          <DotsThreeIcon size={TITLE_CARD_ACTION_ICON_SIZE} weight="bold" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {actions.map(({ id, group, ...props }, index) => {
          const startsGroup = group !== actions[index - 1]?.group;

          return (
            <Fragment key={id}>
              {index > 0 && startsGroup && <Menu.Divider />}
              {group && startsGroup && <Menu.Label>{group}</Menu.Label>}
              <TitleCardActionItem {...props} />
            </Fragment>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

export default TitleCardActions;

import { ActionIcon, Center, Menu } from '@mantine/core';
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

/** Область нажатия сохраняет 24px, но высоту строки задаёт мета-текст. */
function TitleCardActions({ actions }: Props) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;

  return (
    <Menu position="bottom-end" withinPortal>
      <Center w={TITLE_CARD_ACTION_SIZE} h="1lh" fz="xs" lh="tight" flex="none">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={TITLE_CARD_ACTION_SIZE}
            flex="none"
            aria-label={t('titleActions')}
          >
            <DotsThreeIcon size={TITLE_CARD_ACTION_ICON_SIZE} weight="bold" />
          </ActionIcon>
        </Menu.Target>
      </Center>
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

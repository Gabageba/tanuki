import { Button, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import useAutoCloseDrawer from '@/shared/hooks/useAutoCloseDrawer';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { SHEET_HEIGHT } from '@/shared/ui/ResponsiveDrawer/models';
import useExclusiveFilterConfirm from '../hooks/useExclusiveFilterConfirm';
import FilterDrawerTitle from './FilterDrawerTitle';
import FilterDrawerGroups from './FilterDrawerGroups';
import FilterRender from '../FilterRender';
import ExclusiveFilterConfirmModal from '../ExclusiveFilterConfirmModal';

type Props = {
  groups: FilterGroup[];
  selection: FilterSelection[];
  opened: boolean;
  onClose: () => void;
  onChange: (selection: FilterSelection[]) => void;
};

function FilterDrawer({ groups, selection, opened, onClose, onChange }: Props) {
  const { t } = useTranslation();
  useAutoCloseDrawer(opened, onClose);

  const [draft, setDraft] = useState(selection);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [wasOpened, setWasOpened] = useState(opened);
  const { applyChange, pending, confirmPending, cancelPending } = useExclusiveFilterConfirm();

  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setDraft(selection);
      setActiveGroupId(null);
    }
  }

  const activeGroup = groups.find((group) => group.id === activeGroupId);

  return (
    <>
      <ResponsiveDrawer
        opened={opened}
        onClose={onClose}
        hiddenFrom="sm"
        height={SHEET_HEIGHT.TALL}
        title={
          <FilterDrawerTitle
            activeGroup={activeGroup}
            setActiveGroupId={setActiveGroupId}
            draft={draft}
          />
        }
      >
        <Stack gap="sm" h="100%">
          {activeGroup ? (
            <FilterRender
              group={activeGroup}
              selection={draft}
              onChange={(next) => applyChange(groups, activeGroup, draft, next, setDraft)}
            />
          ) : (
            <FilterDrawerGroups groups={groups} draft={draft} setActiveGroupId={setActiveGroupId} />
          )}
          <Group justify="flex-end">
            <Button
              flex={1}
              variant="subtle"
              color="gray"
              onClick={() => {
                onClose();
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              flex={1}
              leftSection={<CheckIcon />}
              onClick={() => {
                onChange(draft);
                onClose();
              }}
            >
              {t('apply')}
            </Button>
          </Group>
        </Stack>
      </ResponsiveDrawer>
      <ExclusiveFilterConfirmModal
        opened={!!pending}
        groupTitle={pending?.group.title}
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </>
  );
}

export default FilterDrawer;

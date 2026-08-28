import { Button, Drawer, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import useAutoCloseDrawer from '@/shared/hooks/useAutoCloseDrawer';
import useExclusiveFilterConfirm from '../../../hooks/useExclusiveFilterConfirm';
import CatalogFilterDrawerTitle from './CatalogFilterDrawerTitle';
import CatalogFilterDrawerGroups from './CatalogFilterDrawerGroups';
import CatalogFilterRender from '../CatalogFilterRender';
import ExclusiveFilterConfirmModal from '../ExclusiveFilterConfirmModal';

type Props = {
  groups: FilterGroup[];
  selection: FilterSelection[];
  opened: boolean;
  onClose: () => void;
  onChange: (selection: FilterSelection[]) => void;
};

function CatalogFilterDrawer({ groups, selection, opened, onClose, onChange }: Props) {
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
      <Drawer
        opened={opened}
        onClose={onClose}
        hiddenFrom="sm"
        size="xl"
        overlayProps={{ hiddenFrom: 'sm' }}
        position="bottom"
        title={
          <CatalogFilterDrawerTitle
            activeGroup={activeGroup}
            setActiveGroupId={setActiveGroupId}
            draft={draft}
          />
        }
      >
        <Stack gap="sm" h="100%">
          {activeGroup ? (
            <CatalogFilterRender
              group={activeGroup}
              selection={draft}
              onChange={(next) => applyChange(groups, activeGroup, draft, next, setDraft)}
            />
          ) : (
            <CatalogFilterDrawerGroups
              groups={groups}
              draft={draft}
              setActiveGroupId={setActiveGroupId}
            />
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
              Отменить
            </Button>
            <Button
              flex={1}
              onClick={() => {
                onChange(draft);
                onClose();
              }}
            >
              Применить
            </Button>
          </Group>
        </Stack>
      </Drawer>
      <ExclusiveFilterConfirmModal
        opened={!!pending}
        groupTitle={pending?.group.title}
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </>
  );
}

export default CatalogFilterDrawer;

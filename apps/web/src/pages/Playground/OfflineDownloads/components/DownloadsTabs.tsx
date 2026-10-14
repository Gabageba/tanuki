import { useMemo } from 'react';
import { Tabs } from '@mantine/core';
import { CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';
import { DOWNLOADED_LAYOUT, QUEUE_REORDER, QUEUE_STATE, type QueueReorder } from '../models';
import DownloadedBlock from './DownloadedBlock';
import QueueBlock from './QueueBlock';

type Props = {
  /** Итог — с перетаскиванием (Q2). */
  reorder?: QueueReorder;
};

/** L4 — очередь и скачанное на разных вкладках. */
function DownloadsTabs({ reorder = QUEUE_REORDER.MENU }: Props) {
  const TABS = useMemo(
    () => [
      {
        id: 'queue',
        title: 'Очередь',
        icon: <ClockIcon />,
        content: <QueueBlock reorder={reorder} queueState={QUEUE_STATE.RUNNING} />,
      },
      {
        id: 'downloaded',
        title: 'Скачанное',
        icon: <CheckCircleIcon />,
        content: <DownloadedBlock layout={DOWNLOADED_LAYOUT.TABS} />,
      },
    ],
    [reorder],
  );

  return (
    <Tabs defaultValue="queue">
      <Tabs.List mb="md">
        {TABS.map((tab) => (
          <Tabs.Tab key={tab.id} value={tab.id} leftSection={tab.icon}>
            {tab.title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((tab) => (
        <Tabs.Panel key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

export default DownloadsTabs;

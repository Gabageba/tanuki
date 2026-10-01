import { useState } from 'react';
import { Tabs } from '@mantine/core';
import { getTabs } from '../lib';
import type { TabNaming } from '../models';

type Props = {
  naming: TabNaming;
  /** Вкладки в одну строку с прокруткой вбок, а не переносом. */
  isScrollable?: boolean;
};

/** Полоса вкладок страницы настроек — как в Settings, с новой вкладкой выбранной. */
function TabsStrip({ naming, isScrollable = false }: Props) {
  const tabs = getTabs(naming);
  const [activeTab, setActiveTab] = useState<string | null>(tabs.at(-1)?.value ?? null);

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List
        style={
          isScrollable
            ? { flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }
            : undefined
        }
      >
        {tabs.map(({ value, label, icon }) => (
          <Tabs.Tab
            key={value}
            value={value}
            leftSection={icon}
            style={isScrollable ? { flex: 'none', whiteSpace: 'nowrap' } : undefined}
          >
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

export default TabsStrip;

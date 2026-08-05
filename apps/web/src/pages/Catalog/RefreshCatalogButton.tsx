import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';

const COOLDOWN_MS = 2 * 60 * 1000;
const storageKey = (sourceId: string) => `catalog-refresh-at:${sourceId}`;

function readRemainingMs(sourceId: string): number {
  const storedAt = Number(localStorage.getItem(storageKey(sourceId)) ?? 0);
  return Math.max(0, storedAt + COOLDOWN_MS - Date.now());
}

interface RefreshCatalogButtonProps {
  sourceId: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function RefreshCatalogButton({
  sourceId,
  isRefreshing,
  onRefresh,
}: RefreshCatalogButtonProps) {
  const [remainingMs, setRemainingMs] = useState(() => readRemainingMs(sourceId));

  useEffect(() => {
    const interval = setInterval(() => setRemainingMs(readRemainingMs(sourceId)), 1000);
    return () => clearInterval(interval);
  }, [sourceId]);

  const handleClick = () => {
    localStorage.setItem(storageKey(sourceId), String(Date.now()));
    setRemainingMs(COOLDOWN_MS);
    onRefresh();
  };

  const onCooldown = remainingMs > 0;

  return (
    <Button
      variant="default"
      size="sm"
      loading={isRefreshing}
      disabled={onCooldown}
      onClick={handleClick}
    >
      {onCooldown ? `Обновить (${Math.ceil(remainingMs / 1000)}с)` : 'Обновить список'}
    </Button>
  );
}

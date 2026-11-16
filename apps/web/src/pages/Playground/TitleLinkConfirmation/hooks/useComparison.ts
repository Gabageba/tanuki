import { useEffect, useRef, useState } from 'react';
import { MATCH_CONFIDENCE, TITLE_LINK_VERDICT, type TitleLinkVerdict } from '@tanuki/contracts';
import { MATCHES } from '../mocks';
import { SAVE_DELAY_MS } from '../models';

function useComparison(initialIndex: number, initiallyOpened: boolean) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [opened, setOpened] = useState(initiallyOpened);
  const [verdicts, setVerdicts] = useState<Partial<Record<string, TitleLinkVerdict>>>(() =>
    Object.fromEntries(
      MATCHES.filter(({ confidence }) => confidence === MATCH_CONFIDENCE.CONFIRMED).map(
        ({ title }) => [title.id, TITLE_LINK_VERDICT.CONFIRMED],
      ),
    ),
  );
  const [pendingVerdict, setPendingVerdict] = useState<TitleLinkVerdict | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const select = (index: number) => {
    if (pendingVerdict !== null) return;
    setSelectedIndex(index);
    setOpened(true);
  };

  const saveMany = (verdict: TitleLinkVerdict, indexes: number[], onSaved?: () => void) => {
    if (pendingVerdict !== null || indexes.length === 0) return;
    setPendingVerdict(verdict);
    setPendingIndex(indexes[0]!);
    timerRef.current = setTimeout(() => {
      setVerdicts((current) => ({
        ...current,
        ...Object.fromEntries(indexes.map((index) => [MATCHES[index]!.title.id, verdict])),
      }));
      setPendingVerdict(null);
      setPendingIndex(null);
      onSaved?.();
    }, SAVE_DELAY_MS);
  };
  const save = (verdict: TitleLinkVerdict, index = selectedIndex, onSaved?: () => void) =>
    saveMany(verdict, [index], onSaved);

  return {
    selectedIndex,
    opened,
    close: () => setOpened(false),
    select,
    save,
    saveMany,
    pendingVerdict,
    pendingIndex,
    verdicts,
    confirmManual: (targetId: string) =>
      setVerdicts((current) => ({ ...current, [targetId]: TITLE_LINK_VERDICT.CONFIRMED })),
    verdict: verdicts[MATCHES[selectedIndex]!.title.id] ?? TITLE_LINK_VERDICT.NONE,
  };
}

export default useComparison;

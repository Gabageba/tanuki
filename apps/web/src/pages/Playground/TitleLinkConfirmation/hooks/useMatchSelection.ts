import { useState } from 'react';

function useMatchSelection(disabled: boolean) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const toggleSelection = (index: number) => {
    if (disabled) return;
    setSelectedIndexes((current) =>
      current.includes(index) ? current.filter((value) => value !== index) : [...current, index],
    );
  };
  const clearSelection = () => setSelectedIndexes([]);

  return { selectedIndexes, toggleSelection, clearSelection };
}

export default useMatchSelection;

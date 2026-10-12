import { Button, ThemeIcon } from '@mantine/core';
import { CaretDownIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { SOURCE_ID } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { MOCK_PAGE, type MockPage } from '../models';

type Props = {
  page: MockPage;
  /** H4 — без рамки, как соседний пункт навигации. */
  isSubtle?: boolean;
};

/** Выбор источника в шапке: на каталоге — источник, в остальных местах — «Все источники». Иконка
 *  «все» — как `AllElementsIcon` из app/Layout: импортировать из app нельзя. */
function HeaderSourceSelectMock({ page, isSubtle = false }: Props) {
  const isCatalog = page === MOCK_PAGE.CATALOG;

  return (
    <Button
      variant={isSubtle ? 'subtle' : 'default'}
      color={isSubtle ? 'gray' : undefined}
      fz={16}
      leftSection={
        isCatalog ? (
          <SourceIcon id={SOURCE_ID.REMANGA} title="Реманга" size={20} />
        ) : (
          <ThemeIcon size={20} bdrs="sm">
            <SquaresFourIcon />
          </ThemeIcon>
        )
      }
      rightSection={<CaretDownIcon />}
    >
      {isCatalog ? 'Реманга' : 'Все источники'}
    </Button>
  );
}

export default HeaderSourceSelectMock;

import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { FILTER_TYPE, type FilterGroup } from '@tanuki/contracts';
import type { FilterSelection } from '../../../../../../../packages/contracts/dist/cjs';
import CheckboxFilterListGroup from './CheckboxFilterListGroup';
import SearchableCheckboxListFilterGroup from './SearchableCheckboxListFilterGroup';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function CatalogFilterRender({ group, selection, onChange, scrollAreaProps }: Props) {
  if (group.type === FILTER_TYPE.CHECKBOX || group.title === FILTER_TYPE.CHECKBOX_EXCLUDE) {
    return (
      <CheckboxFilterListGroup
        group={group}
        selection={selection}
        onChange={onChange}
        scrollAreaProps={scrollAreaProps}
      />
    );
  }

  if (
    group.type === FILTER_TYPE.SEARCHABLE_CHECKBOX ||
    group.type === FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE
  ) {
    return (
      <SearchableCheckboxListFilterGroup
        group={group}
        selection={selection}
        onChange={onChange}
        scrollAreaProps={scrollAreaProps}
      />
    );
  }

  if (group.type === FILTER_TYPE.RANGE) {
    return <></>;
  }

  return null;
}

export default CatalogFilterRender;

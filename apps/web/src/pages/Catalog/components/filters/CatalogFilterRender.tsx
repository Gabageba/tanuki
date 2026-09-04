import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { FILTER_TYPE, type FilterGroup, type FilterSelection } from '@tanuki/contracts';
import CheckboxFilterListGroup from './CheckboxFilterListGroup';
import SearchableCheckboxListFilterGroup from './SearchableCheckboxListFilterGroup';
import RangeFilterGroup from './RangeFilterGroup';
import RadioFilterGroup from './RadioFilterGroup';
import SearchableRadioFilterGroup from './SearchableRadioFilterGroup';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function CatalogFilterRender({ group, selection, onChange, scrollAreaProps }: Props) {
  if (group.type === FILTER_TYPE.CHECKBOX || group.type === FILTER_TYPE.CHECKBOX_EXCLUDE) {
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
    return <RangeFilterGroup group={group} selection={selection} onChange={onChange} />;
  }

  if (group.type === FILTER_TYPE.RADIO) {
    return (
      <RadioFilterGroup
        group={group}
        selection={selection}
        onChange={onChange}
        scrollAreaProps={scrollAreaProps}
      />
    );
  }

  if (group.type === FILTER_TYPE.SEARCHABLE_RADIO) {
    return (
      <SearchableRadioFilterGroup
        group={group}
        selection={selection}
        onChange={onChange}
        scrollAreaProps={scrollAreaProps}
      />
    );
  }

  return null;
}

export default CatalogFilterRender;

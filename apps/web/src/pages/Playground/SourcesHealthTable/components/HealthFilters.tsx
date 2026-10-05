import { Group } from '@mantine/core';
import { BooksIcon, CircleHalfIcon } from '@phosphor-icons/react';
import {
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  type SourceContentType,
  type SourceStatus,
} from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getContentTypeLabel, getStatusLabel } from '../lib';

type Props = {
  status: SourceStatus[];
  contentType: SourceContentType[];
  onStatusChange: (status: SourceStatus[]) => void;
  onContentTypeChange: (contentType: SourceContentType[]) => void;
};

const isStatus = (value: string): value is SourceStatus =>
  Object.values(SOURCE_STATUS).some((status) => status === value);

const isContentType = (value: string): value is SourceContentType =>
  Object.values(SOURCE_CONTENT_TYPE).some((contentType) => contentType === value);

/** Два списка с выбором нескольких, как у приглашений; ничего не выбрано — без ограничения.
 *  Поиска нет — источников два десятка. */
function HealthFilters({ status, contentType, onStatusChange, onContentTypeChange }: Props) {
  return (
    <Group gap="xs" grow wrap="nowrap" maw={{ sm: 500 }}>
      <CompactMultiSelect
        data={Object.values(SOURCE_STATUS).map((value) => ({
          value,
          label: getStatusLabel(value),
        }))}
        value={status}
        placeholder={status.length ? undefined : 'Все статусы'}
        clearable
        leftSection={<CircleHalfIcon />}
        onChange={(values) => onStatusChange(values.filter(isStatus))}
      />
      <CompactMultiSelect
        data={Object.values(SOURCE_CONTENT_TYPE).map((value) => ({
          value,
          label: getContentTypeLabel(value),
        }))}
        value={contentType}
        placeholder={contentType.length ? undefined : 'Весь контент'}
        clearable
        leftSection={<BooksIcon />}
        onChange={(values) => onContentTypeChange(values.filter(isContentType))}
      />
    </Group>
  );
}

export default HealthFilters;

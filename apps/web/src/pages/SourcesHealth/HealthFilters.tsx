import { Flex } from '@mantine/core';
import { BooksIcon, CircleHalfIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  type SourceContentType,
  type SourceStatus,
} from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getLabelByContentType, getSourceStatusLabel } from '@/entities/source/lib';

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

/** Как у приглашений: статус и вид контента, ничего не выбрано — без ограничения. На телефоне
 *  списки друг под другом. */
function HealthFilters({ status, contentType, onStatusChange, onContentTypeChange }: Props) {
  const { t } = useTranslation();

  return (
    <Flex gap="xs" direction={{ base: 'column', xs: 'row' }}>
      <CompactMultiSelect
        w={{ xs: 240 }}
        data={Object.values(SOURCE_STATUS).map((value) => ({
          value,
          label: getSourceStatusLabel(value, t),
        }))}
        value={status}
        placeholder={t('allStatuses')}
        clearable
        leftSection={<CircleHalfIcon />}
        onChange={(values) => onStatusChange(values.filter(isStatus))}
      />
      <CompactMultiSelect
        w={{ xs: 260 }}
        data={Object.values(SOURCE_CONTENT_TYPE).map((value) => ({
          value,
          label: getLabelByContentType(value, t),
        }))}
        value={contentType}
        placeholder={t('allContent')}
        clearable
        leftSection={<BooksIcon />}
        onChange={(values) => onContentTypeChange(values.filter(isContentType))}
      />
    </Flex>
  );
}

export default HealthFilters;

import type { TextInputProps } from '@mantine/core';
import { TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { MagnifyingGlassIcon, XCircleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SearchInput.module.scss';

type Props = {
  handleSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  allowClear?: boolean;
} & Omit<
  TextInputProps,
  'type' | 'className' | 'enterKeyHint' | 'leftSection' | 'rightSection' | 'value' | 'onChange'
>;

function SearchInput({
  handleSearch,
  debounceMs,
  className,
  allowClear = false,
  ...restProps
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedSearch = useDebouncedCallback(handleSearch, debounceMs ?? 0);

  const clear = () => {
    debouncedSearch.cancel();
    setQuery('');
    handleSearch('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        debouncedSearch.cancel();
        if (query.trim()) {
          handleSearch(query.trim());
        }
      }}
      className={className}
    >
      <TextInput
        {...restProps}
        className={styles.textInput}
        type="search"
        enterKeyHint="search"
        leftSection={<MagnifyingGlassIcon />}
        rightSection={
          !!query && allowClear && <XCircleIcon onClick={clear} aria-label={t('clearSearch')} />
        }
        value={query}
        onChange={(event) => {
          const value = event.currentTarget.value;
          setQuery(value);
          if (debounceMs !== undefined) {
            debouncedSearch(value.trim());
          }
        }}
      />
    </form>
  );
}

export default SearchInput;

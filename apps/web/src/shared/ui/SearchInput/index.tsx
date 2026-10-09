import type { TextInputProps } from '@mantine/core';
import { TextInput } from '@mantine/core';
import { useDebouncedCallback, useUncontrolled } from '@mantine/hooks';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import styles from './SearchInput.module.scss';

type Props = {
  handleSearch?: (query: string) => void;
  debounceMs?: number;
  className?: string;
  allowClear?: boolean;
  /** Текст поля, если им управляет родитель, — например, чтобы сбросить его снаружи. */
  value?: string;
  /** Начальный текст неуправляемого поля — например, запрос из адреса. */
  defaultValue?: string;
  onChange?: (value: string) => void;
} & Omit<
  TextInputProps,
  | 'type'
  | 'className'
  | 'enterKeyHint'
  | 'leftSection'
  | 'rightSection'
  | 'value'
  | 'defaultValue'
  | 'onChange'
>;

function SearchInput({
  handleSearch,
  debounceMs,
  className,
  allowClear = false,
  value,
  defaultValue,
  onChange,
  ...restProps
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useUncontrolled({ value, defaultValue, finalValue: '', onChange });
  const debouncedSearch = useDebouncedCallback(
    (nextQuery: string) => handleSearch?.(nextQuery),
    debounceMs ?? 0,
  );

  const clear = () => {
    debouncedSearch.cancel();
    setQuery('');
    handleSearch?.('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        debouncedSearch.cancel();
        if (query.trim()) {
          handleSearch?.(query.trim());
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
          !!query && allowClear && <XIcon onClick={clear} aria-label={t('clearSearch')} />
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

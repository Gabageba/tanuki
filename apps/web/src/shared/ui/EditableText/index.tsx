import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  ActionIcon,
  Group,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
  type TitleProps,
} from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { CheckIcon, PencilSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import styles from './EditableText.module.scss';

type Props = Omit<TitleProps, 'children'> & {
  value: string;
  /** Может вернуть промис: пока он не завершится, поле заблокировано, а при ошибке остаётся открытым. */
  onSave: (value: string) => unknown;
  /** Возвращает текст ошибки или null, если значение подходит. */
  validate?: (value: string) => string | null;
  maxLength?: number;
};

function EditableText({ value, onSave, validate, maxLength, className, ...titleProps }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // select() и фокусирует поле, и выделяет значение целиком — его обычно переписывают
  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  const close = () => {
    setEditing(false);
    setError(null);
  };

  const submit = async () => {
    if (saving) {
      return;
    }

    const next = draft.trim();

    if (!next || next === value) {
      close();
      return;
    }

    const validationError = validate?.(next) ?? null;

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await onSave(next);
      close();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('error'));
    } finally {
      setSaving(false);
    }
  };

  const ref = useClickOutside<HTMLDivElement>(() => {
    if (editing) {
      void submit();
    }
  });

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }

    if (event.key === 'Escape') {
      close();
    }
  };

  return (
    <Title {...titleProps} className={className ? `${styles.root} ${className}` : styles.root}>
      {editing ? (
        <Tooltip label={error} opened={!!error} color="red" position="bottom-start" withArrow>
          <Group
            ref={ref}
            gap={4}
            wrap="nowrap"
            className={styles.box}
            data-editing
            data-error={!!error || undefined}
          >
            <TextInput
              ref={inputRef}
              variant="unstyled"
              classNames={{ root: styles.field, wrapper: styles.wrapper, input: styles.input }}
              value={draft}
              maxLength={maxLength}
              readOnly={saving}
              aria-invalid={!!error}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              className={styles.action}
              aria-label={t('save')}
              disabled={saving}
              onClick={() => void submit()}
            >
              <CheckIcon size="0.7em" weight="bold" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              className={styles.action}
              aria-label={t('cancel')}
              disabled={saving}
              onClick={close}
            >
              <XIcon size="0.7em" weight="bold" />
            </ActionIcon>
          </Group>
        </Tooltip>
      ) : (
        <UnstyledButton className={styles.box} title={t('edit')} onClick={startEditing}>
          {/* fz явно: в теме у Text стоит fz 14 инлайн-стилем, его inherit не перебивает */}
          <Group gap={8}>
            <Text span inherit fz="inherit" truncate className={styles.text}>
              {value}
            </Text>
            <PencilSimpleIcon className={styles.pencil} size="0.6em" weight="bold" />
          </Group>
        </UnstyledButton>
      )}
    </Title>
  );
}

export default EditableText;

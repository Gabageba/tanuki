import type { ReactNode } from 'react';
import { Button, Group, Menu } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { ChapterNumbering, LinkedReadingProgress } from '@tanuki/contracts';
import type { ReadingMark } from '@/entities/title/models';
import ContinueFromSourceItem from './ContinueFromSourceItem';
import styles from './TitleReadingActions.module.scss';

type Props = {
  titleId: string;
  /** Отметки на других источниках группы. */
  linked: LinkedReadingProgress[];
  /** Их места в ветке основной кнопки. */
  linkedMarks: ReadingMark[];
  numbering: ChapterNumbering;
  /** Основная кнопка — делит ряд со стрелкой. */
  children: ReactNode;
};

/**
 * Split-кнопка: слева основная кнопка, под стрелкой — продолжить с места каждого из других
 * источников.
 */
function OtherSourcesSplitButton({ titleId, linked, linkedMarks, numbering, children }: Props) {
  const { t } = useTranslation();

  return (
    <Group gap={1} wrap="nowrap" className={styles.splitButton}>
      {children}
      <Menu position="bottom-end" width={300} withinPortal>
        <Menu.Target>
          <Button px="xs" aria-label={t('continueFromOtherSource')} className={styles.menuButton}>
            <CaretDownIcon />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{t('continueFromOtherSource')}</Menu.Label>
          {linked.map((item) => (
            <ContinueFromSourceItem
              key={item.sourceId}
              titleId={titleId}
              progress={item}
              numbering={numbering}
              mark={linkedMarks.find((mark) => mark.progress.sourceId === item.sourceId)}
            />
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

export default OtherSourcesSplitButton;

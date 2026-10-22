import type { MouseEvent } from 'react';
import { ActionIcon, Center, Menu, RingProgress, Tooltip } from '@mantine/core';
import {
  CheckCircleIcon,
  ClockIcon,
  DownloadSimpleIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { getDownloadErrorLabel } from '../lib';
import { CHAPTER_ACTION, DOWNLOAD_STATUS, type ChapterAction, type MockChapter } from '../models';

type Props = {
  chapter: MockChapter;
  onAction: (action: ChapterAction) => void;
  /** C4: прогресс рисует полоса строки, а на месте кольца — крестик отмены. */
  isCancelCross?: boolean;
  /** C2e — значки в насыщенных цветах, как метки C3, а не в бледных тонах `subtle`. */
  isIconTinted?: boolean;
};

/** Строка — ссылка в читалку: клик по иконке до неё доходить не должен. */
const stop = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/** Иконка-кнопка состояния скачивания на месте ↓: часы, кольцо прогресса, галочка с меню или
 *  красный «!». Клик по часам или кольцу отменяет, по «!» — повторяет. */
function DownloadStatusControl({
  chapter,
  onAction,
  isCancelCross = false,
  isIconTinted = false,
}: Props) {
  const tint = (color: string) => (isIconTinted ? color : undefined);

  const act = (action: ChapterAction) => (event: MouseEvent) => {
    stop(event);
    onAction(action);
  };

  if (chapter.status === DOWNLOAD_STATUS.DONE) {
    return (
      <Menu position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" color="teal" aria-label="Глава скачана" onClick={stop}>
            <CheckCircleIcon weight="fill" color={tint('var(--mantine-color-teal-filled)')} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            color="red"
            leftSection={<TrashIcon />}
            onClick={() => onAction(CHAPTER_ACTION.DELETE)}
          >
            Удалить скачанную главу
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  if (chapter.status === DOWNLOAD_STATUS.FAILED) {
    const label = chapter.error ? getDownloadErrorLabel(chapter.error) : 'Не удалось скачать';
    return (
      <Tooltip label={`${label}. Нажмите, чтобы повторить`}>
        <ActionIcon variant="subtle" color="red" onClick={act(CHAPTER_ACTION.RETRY)}>
          <WarningCircleIcon weight="fill" color={tint('var(--mantine-color-red-filled)')} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (chapter.status === DOWNLOAD_STATUS.QUEUED) {
    return (
      <Tooltip label="В очереди. Нажмите, чтобы отменить">
        <ActionIcon variant="subtle" color="gray" onClick={act(CHAPTER_ACTION.CANCEL)}>
          <ClockIcon color={tint('var(--mantine-color-dimmed)')} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (chapter.status === DOWNLOAD_STATUS.DOWNLOADING) {
    return (
      <Tooltip label="Скачивается. Нажмите, чтобы отменить">
        <ActionIcon variant="subtle" color="gray" onClick={act(CHAPTER_ACTION.CANCEL)}>
          {isCancelCross ? (
            <XIcon />
          ) : (
            <RingProgress
              size={22}
              thickness={2.5}
              roundCaps
              sections={[
                {
                  value: (chapter.pagesDone / chapter.pagesTotal) * 100,
                  color: 'var(--mantine-primary-color-filled)',
                },
              ]}
              label={
                <Center>
                  <XIcon size={9} weight="bold" />
                </Center>
              }
            />
          )}
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Tooltip label="Скачать главу">
      <ActionIcon variant="subtle" onClick={act(CHAPTER_ACTION.DOWNLOAD)}>
        <DownloadSimpleIcon />
      </ActionIcon>
    </Tooltip>
  );
}

export default DownloadStatusControl;

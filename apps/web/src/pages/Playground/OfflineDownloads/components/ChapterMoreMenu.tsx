import type { MouseEvent } from 'react';
import { ActionIcon, Menu } from '@mantine/core';
import {
  ArrowCounterClockwiseIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { CHAPTER_ACTION, DOWNLOAD_STATUS, type ChapterAction, type MockChapter } from '../models';

type Props = {
  chapter: MockChapter;
  onAction: (action: ChapterAction) => void;
};

const stop = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/** C3 — справа всегда «⋯»: что можно сделать с главой, зависит от её состояния. */
function ChapterMoreMenu({ chapter, onAction }: Props) {
  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label="Действия с главой" onClick={stop}>
          <DotsThreeIcon />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {chapter.status === null && (
          <Menu.Item
            leftSection={<DownloadSimpleIcon />}
            onClick={() => onAction(CHAPTER_ACTION.DOWNLOAD)}
          >
            Скачать главу
          </Menu.Item>
        )}
        {(chapter.status === DOWNLOAD_STATUS.QUEUED ||
          chapter.status === DOWNLOAD_STATUS.DOWNLOADING) && (
          <Menu.Item leftSection={<XIcon />} onClick={() => onAction(CHAPTER_ACTION.CANCEL)}>
            Отменить загрузку главы
          </Menu.Item>
        )}
        {chapter.status === DOWNLOAD_STATUS.FAILED && (
          <Menu.Item
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => onAction(CHAPTER_ACTION.RETRY)}
          >
            Повторить загрузку главы
          </Menu.Item>
        )}
        {chapter.status === DOWNLOAD_STATUS.DONE && (
          <Menu.Item
            color="red"
            leftSection={<TrashIcon />}
            onClick={() => onAction(CHAPTER_ACTION.DELETE)}
          >
            Удалить скачанную главу
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

export default ChapterMoreMenu;

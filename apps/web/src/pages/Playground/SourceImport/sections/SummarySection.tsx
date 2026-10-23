import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import AccountsMock from '../components/AccountsMock';
import DoneStep from '../components/DoneStep';
import EmptyBookmarksMock from '../components/EmptyBookmarksMock';
import FoldersStep from '../components/FoldersStep';
import QuestionsStep from '../components/QuestionsStep';
import { LIBRARY_FOLDERS } from '../mocks';
import { DONE_VIEW, EMPTY_ACTIONS, FOLDERS_VIEW, HEADER_BUTTON } from '../models';

/** Итог — выбранная комбинация: шаги модалки по порядку и точки входа. */
function SummarySection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="I"
        title="Итог"
        description="Выбранное вместе: шаги модалки после чтения закладок по порядку и две точки входа. Состояния шага «Папки» — как в S."
      />
      <DemoSection
        code="F1 + S + Q + G3 + H0 + E4"
        title="Выбор папками, вопросы, итог с переносом отметок"
        description="Папки — рамкой GroupedList со словами, куда ляжет каждая; конфликты среди выбранного — шагом «Вопросы» как у копии; на «Готово» отметки — строкой «переносим». Кнопки импорта в «Аккаунтах источников» нет; в пустых закладках импорт — ссылкой в конце описания, над кнопкой каталога."
      >
        <Stack gap="lg">
          <Group align="flex-start" gap="lg">
            <CaptionedFrame caption="Папки · F1">
              <FoldersStep folders={LIBRARY_FOLDERS} view={FOLDERS_VIEW.LIST} />
            </CaptionedFrame>
            <CaptionedFrame caption="Вопросы · Q">
              <QuestionsStep />
            </CaptionedFrame>
            <CaptionedFrame caption="Готово · G3">
              <DoneStep view={DONE_VIEW.LOADER} />
            </CaptionedFrame>
          </Group>
          <Group align="flex-start" gap="lg">
            <CaptionedFrame caption="Пустые закладки · E4">
              <EmptyBookmarksMock actions={EMPTY_ACTIONS.IMPORT_IN_DESCRIPTION} />
            </CaptionedFrame>
            <CaptionedFrame caption="Пустые закладки · E4 · телефон">
              <EmptyBookmarksMock actions={EMPTY_ACTIONS.IMPORT_IN_DESCRIPTION} isPhone />
            </CaptionedFrame>
            <CaptionedFrame caption="Аккаунты источников · H0">
              <AccountsMock button={HEADER_BUTTON.NONE} />
            </CaptionedFrame>
          </Group>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default SummarySection;

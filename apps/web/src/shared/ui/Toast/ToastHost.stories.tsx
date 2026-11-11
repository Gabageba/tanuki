import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Group } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { expect, userEvent, within } from 'storybook/test';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND, TOAST_PAUSE } from '@/shared/lib/toasts/models';
import { I18N } from '@/shared/lib/i18n';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import ToastOverlayDemo from '@/shared/storybook/ToastOverlayDemo';
import UndoToastMessage from '@/shared/ui/UndoToastMessage';

const showStack = () => {
  const undo = Toasts.show({
    title: I18N.t('removedFromBookmarks'),
    kind: TOAST_KIND.UNDO,
    tone: FEEDBACK_TONE.ACCENT,
    icon: <BookmarkSimpleIcon size={20} />,
    actions: (
      <UndoToastMessage
        actionsOnly
        actionLabel={I18N.t('restoreBookmark')}
        onAction={() => Toasts.act(undo, () => undefined)}
      />
    ),
  });
  const error = Toasts.show({
    title: I18N.t('failedToSave'),
    description: I18N.t('noConnectionToServer'),
    tone: FEEDBACK_TONE.DANGER,
  });
  const success = Toasts.show({ title: I18N.t('linkCopied'), tone: FEEDBACK_TONE.SUCCESS });
  [undo, error, success].forEach((id) => Toasts.pause(id, TOAST_PAUSE.HOVER, true));
};
const META = {
  title: 'Тосты/ToastHost',
  render: () => (
    <Group m="md">
      <Button leftSection={<BellIcon />} onClick={showStack}>
        Показать стек
      </Button>
    </Group>
  ),
} satisfies Meta;
export default META;
type Story = StoryObj<typeof META>;
export const Mixed: Story = { name: 'Смешанный стек', play: showStack };
export const Mobile: Story = { ...Mixed, name: 'Стек на телефоне', globals: MOBILE_GLOBALS };
export const Overflow: Story = {
  name: 'Переполнение — последние три',
  play: async ({ canvasElement }) => {
    for (let index = 0; index < 4; index++) {
      const id = Toasts.show({
        id: `overflow-${index + 1}`,
        title: `${I18N.t('removedFromBookmarks')} · ${index + 1}`,
        kind: TOAST_KIND.UNDO,
        tone: FEEDBACK_TONE.ACCENT,
        icon: <BookmarkSimpleIcon size={20} />,
      });
      Toasts.pause(id, TOAST_PAUSE.HOVER, true);
    }
    const body = canvasElement.ownerDocument.body;
    await expect(body.querySelector('[data-toast-id="overflow-1"]')).toBeNull();
    await expect(body.querySelector('[data-toast-id="overflow-4"]')).toBeVisible();
  },
};
export const KeyboardFocus: Story = {
  ...Mixed,
  name: 'Клавиатурный фокус',
  play: async ({ canvasElement }) => {
    showStack();
    await userEvent.tab();
    await userEvent.tab();
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getAllByRole('button', { name: I18N.t('close') })[0]).toBeDefined();
  },
};
const overlayPlay = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(await body.findByRole('button', { name: I18N.t('save') }));
  await expect(body.getByText(I18N.t('failedToSave'))).toBeVisible();
};
export const Modal: Story = {
  name: 'В модалке',
  render: () => <ToastOverlayDemo />,
  play: overlayPlay,
};
export const Drawer: Story = {
  name: 'В дровере',
  render: () => <ToastOverlayDemo drawer />,
  play: overlayPlay,
};
export const SmallHeight: Story = { ...Modal, name: 'На низком экране', globals: MOBILE_GLOBALS };

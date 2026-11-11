import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mantine/core';
import { BellIcon } from '@phosphor-icons/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { PWA_OFFER, type PwaOffer } from './models';
import { showPwaOffer } from './toasts';

const ON_CONFIRM = fn().mockName('onConfirm');
const ON_DISMISS = fn().mockName('onDismiss');

const showOffer = (offer: PwaOffer) =>
  showPwaOffer({ offer, t: I18N.t, onConfirm: ON_CONFIRM, onDismiss: ON_DISMISS });

const META = {
  title: 'Тосты/PwaOfferMessage',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Update: Story = {
  name: 'Доступно обновление',
  render: () => (
    <Button
      m="md"
      variant="default"
      leftSection={<BellIcon />}
      onClick={() => showOffer(PWA_OFFER.UPDATE)}
    >
      Показать
    </Button>
  ),
  play: () => {
    showOffer(PWA_OFFER.UPDATE);
  },
};

export const Install: Story = {
  name: 'Установить Tanuki',
  render: () => (
    <Button
      m="md"
      variant="default"
      leftSection={<BellIcon />}
      onClick={() => showOffer(PWA_OFFER.INSTALL)}
    >
      Показать
    </Button>
  ),
  play: () => {
    showOffer(PWA_OFFER.INSTALL);
  },
};

export const UpdateMobile: Story = {
  ...Update,
  name: 'Обновление на телефоне',
  globals: MOBILE_GLOBALS,
};

export const InstallMobile: Story = {
  ...Install,
  name: 'Установка на телефоне',
  globals: MOBILE_GLOBALS,
};

export const Confirm: Story = {
  ...Update,
  name: 'Применение обновления',
  play: async ({ canvasElement }) => {
    ON_CONFIRM.mockClear();
    ON_DISMISS.mockClear();
    showOffer(PWA_OFFER.UPDATE);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: I18N.t('updateApp') }));
    await expect(ON_CONFIRM).toHaveBeenCalledTimes(1);
    await expect(ON_DISMISS).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(body.queryByText(I18N.t('updateAvailable'))).not.toBeInTheDocument(),
    );
  },
};

export const Dismiss: Story = {
  ...Install,
  name: 'Закрытие предложения',
  play: async ({ canvasElement }) => {
    ON_CONFIRM.mockClear();
    ON_DISMISS.mockClear();
    showOffer(PWA_OFFER.INSTALL);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: I18N.t('close') }));
    await expect(ON_DISMISS).toHaveBeenCalledTimes(1);
    await expect(ON_CONFIRM).not.toHaveBeenCalled();
  },
};

export const Cleanup: Story = {
  ...Install,
  name: 'Скрытие при уходе со страницы',
  play: async () => {
    ON_DISMISS.mockClear();
    const hide = showOffer(PWA_OFFER.INSTALL);
    hide();
    await expect(ON_DISMISS).not.toHaveBeenCalled();
  },
};

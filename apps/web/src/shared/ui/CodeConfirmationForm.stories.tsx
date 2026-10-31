import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent, expect, waitFor } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import CodeConfirmationForm from './CodeConfirmationForm';

const META = {
  title: 'UI/CodeConfirmationForm',
  component: CodeConfirmationForm,
  args: {
    length: 6,
    description: 'Введите код из последнего письма',
    isConfirming: false,
    onConfirm: async () => undefined,
  },
} satisfies Meta<typeof CodeConfirmationForm>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Ввод кода' };

export const Incomplete: Story = {
  name: 'Неполный код',
  play: async () => {
    const button = await screen.findByRole('button', { name: I18N.t('confirmCode') });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
      I18N.t('enterCodeDigits', { count: 6 }),
    );
  },
};

export const Confirming: Story = { name: 'Проверка кода', args: { isConfirming: true } };

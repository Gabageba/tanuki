import { expect, userEvent, waitFor, within } from 'storybook/test';

type PlayContext = {
  canvasElement: HTMLElement;
};

/** `play` истории меню или поповера: открывает его кликом по первой кнопке истории. Кнопка
 *  бывает выключена, пока не пришли данные, — сначала дожидаемся, что она станет активной. */
export const clickFirstButton = async ({ canvasElement }: PlayContext) => {
  const [button] = await within(canvasElement).findAllByRole('button');
  if (!button) return;
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

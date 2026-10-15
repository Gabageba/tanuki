import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiRequestError, NETWORK_ERROR_STATUS } from '@/shared/api/client';
import QueryError from './QueryError';

const META = {
  title: 'Экраны ошибок/QueryError',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

const ON_RETRY = fn().mockName('onRetry');

export const NotFound: Story = {
  name: '404: не найдено',
  render: () => (
    <QueryError
      error={new ApiRequestError('Тайтл не найден на источнике', API_ERROR_CODE.NOT_FOUND, 404)}
    />
  ),
};

export const SourceAccountRequired: Story = {
  name: '403: источник закрыт',
  render: () => (
    <QueryError
      error={
        new ApiRequestError(
          'ReadManga открывается только с вашим аккаунтом Grouple.',
          API_ERROR_CODE.SOURCE_ACCOUNT_REQUIRED,
          403,
        )
      }
    />
  ),
};

export const SourceReloginRequired: Story = {
  name: '403: сессия источника истекла',
  render: () => (
    <QueryError
      error={
        new ApiRequestError(
          'Войдите в аккаунт Grouple ещё раз.',
          API_ERROR_CODE.SOURCE_RELOGIN_REQUIRED,
          403,
        )
      }
    />
  ),
};

export const AdultContentHidden: Story = {
  name: '403: скрыто настройкой 18+',
  render: () => (
    <QueryError
      error={
        new ApiRequestError(
          'Тайтлы 18+ скрыты в настройках.',
          API_ERROR_CODE.ADULT_CONTENT_HIDDEN,
          403,
        )
      }
    />
  ),
};

export const ServerError: Story = {
  name: '502: источник не отвечает',
  render: () => (
    <QueryError
      error={new ApiRequestError('Источник не отвечает', API_ERROR_CODE.SOURCE_UNAVAILABLE, 502)}
      onRetry={ON_RETRY}
    />
  ),
};

export const NetworkError: Story = {
  name: '503: нет связи с сервером',
  render: () => (
    <QueryError
      error={
        new ApiRequestError('Нет связи с сервером', API_ERROR_CODE.INTERNAL, NETWORK_ERROR_STATUS)
      }
      onRetry={ON_RETRY}
    />
  ),
};

export const ClientError: Story = {
  name: '500: сбой на фронте',
  render: () => (
    <QueryError error={new Error('Cannot read properties of undefined')} onRetry={ON_RETRY} />
  ),
};

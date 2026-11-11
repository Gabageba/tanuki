import { ActionIcon, Menu } from '@mantine/core';
import { CopyIcon, DotsThreeIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { showToastError } from '@/shared/api/toastErrors';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  titleId: string;
  name: string;
};

const isShareAbort = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

/** «…» тайтла: системный лист «Поделиться», а где его нет — ссылка в буфер обмена. */
function TitleMoreMenu({ titleId, name }: Props) {
  const { t } = useTranslation();

  const handleShare = async () => {
    const url = new URL(generatePath(ROUTE_PATHS.TITLE, { titleId }), window.location.origin).href;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (error) {
        // Лист закрыли сами — ничего не случилось. Иначе (запрет браузера) — копируем ссылку.
        if (isShareAbort(error)) return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      Toasts.show({
        tone: FEEDBACK_TONE.SUCCESS,
        title: t('linkCopied'),
        icon: <CopyIcon size={20} />,
      });
    } catch (error) {
      showToastError(error);
    }
  };

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon size={36} variant="default" aria-label={t('more')}>
          <DotsThreeIcon />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<ShareNetworkIcon />} onClick={() => void handleShare()}>
          {t('share')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default TitleMoreMenu;

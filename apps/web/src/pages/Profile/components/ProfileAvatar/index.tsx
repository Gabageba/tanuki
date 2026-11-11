import { ActionIcon, Avatar, Box, FileButton, Loader, Text, UnstyledButton } from '@mantine/core';
import { CameraIcon, TrashIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import useUpdateAvatar from './hooks/useUpdateAvatar';
import useDeleteAvatar from './hooks/useDeleteAvatar';
import AvatarCropModal from './AvatarCropModal';
import { cropImage } from './lib';
import { ACCEPTED_IMAGE_TYPES } from './models';
import styles from './ProfileAvatar.module.scss';

type Props = {
  src: string | null | undefined;
  name: string | undefined;
};

function ProfileAvatar({ src, name }: Props) {
  const { t } = useTranslation();
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const resetFileRef = useRef<() => void>(null);
  const { mutate: updateAvatar, isPending: isUpdating } = useUpdateAvatar();
  const { mutate: deleteAvatar, isPending: isDeleting } = useDeleteAvatar();
  const isPending = isUpdating || isDeleting;

  // Ошибки запросов показывает глобальный обработчик — здесь только сбой обрезки на клиенте.
  const showCropError = () =>
    Toasts.show({ tone: FEEDBACK_TONE.DANGER, title: t('tryAgainLater') });

  const pick = (file: File | null) => {
    if (file) setPickedSrc(URL.createObjectURL(file));
    // Иначе повторный выбор того же файла не вызовет onChange
    resetFileRef.current?.();
  };

  const closeCrop = () => {
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
    setPickedSrc(null);
  };

  const save = async (area: Area) => {
    if (!pickedSrc) return;
    try {
      const image = await cropImage(pickedSrc, area);
      updateAvatar(image, { onSuccess: closeCrop });
    } catch {
      showCropError();
    }
  };

  return (
    <Box className={styles.root}>
      <FileButton accept={ACCEPTED_IMAGE_TYPES} onChange={pick} resetRef={resetFileRef}>
        {(props) => (
          <UnstyledButton
            {...props}
            className={styles.picker}
            disabled={isPending}
            aria-label={t('change')}
          >
            <Avatar src={src} variant="outline" color={PRIMARY_COLOR} name={name} size="xl" />
            <Box component="span" className={styles.change}>
              {isPending ? <Loader size={12} color="white" /> : <CameraIcon size={12} />}
              <Text span fz="xs" lh="tight" tt="lowercase">
                {t('change')}
              </Text>
            </Box>
          </UnstyledButton>
        )}
      </FileButton>
      {src && (
        <ActionIcon
          className={styles.delete}
          size="sm"
          radius="sm"
          variant="transparent"
          aria-label={t('delete')}
          disabled={isPending}
          onClick={() => deleteAvatar()}
        >
          <TrashIcon size={14} />
        </ActionIcon>
      )}
      <AvatarCropModal
        src={pickedSrc}
        isSaving={isUpdating}
        onClose={closeCrop}
        onSave={(area) => void save(area)}
      />
    </Box>
  );
}

export default ProfileAvatar;

import { ActionIcon } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import type { RoutePath } from '../consts/routes';

type Props = {
  path?: RoutePath;
};

function GoBackButton({ path }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
      return;
    }
    navigate(-1);
  };

  return (
    <ActionIcon variant="subtle" color="gray" onClick={handleClick}>
      <CaretLeftIcon />
    </ActionIcon>
  );
}

export default GoBackButton;

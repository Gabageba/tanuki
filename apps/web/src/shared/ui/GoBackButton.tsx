import { ActionIcon } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';

type Props = {
  path?: string;
  onClick?: () => void;
};

function GoBackButton({ path, onClick }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      return onClick();
    }
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

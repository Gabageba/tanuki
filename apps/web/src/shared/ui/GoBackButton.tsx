import { ActionIcon } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';

type Props = {
  path?: string;
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

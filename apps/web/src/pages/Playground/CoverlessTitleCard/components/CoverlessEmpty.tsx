import { EmptyState } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';

function CoverlessEmpty() {
  return (
    <EmptyState
      icon={<SparkleIcon />}
      title="В этом блоке сейчас пусто"
      description="Сайт ничего не показывает здесь на главной. Загляните в другой блок."
    />
  );
}

export default CoverlessEmpty;

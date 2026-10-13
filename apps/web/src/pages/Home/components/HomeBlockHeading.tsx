import { Group, Title } from '@mantine/core';
import ArrowLink from '@/shared/ui/ArrowLink';

type Props = {
  title: string;
  /** Ссылка справа со стрелкой — «Все закладки →». */
  link?: { label: string; to: string };
};

/** Заголовок блока главной: название слева, ссылка со стрелкой справа. */
function HomeBlockHeading({ title, link }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Title order={4} miw={0}>
        {title}
      </Title>
      {link && <ArrowLink to={link.to}>{link.label}</ArrowLink>}
    </Group>
  );
}

export default HomeBlockHeading;

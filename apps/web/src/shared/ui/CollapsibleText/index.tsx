import { Anchor, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import useCollapsible from './hooks/useCollapsible';

const DEFAULT_LINE_CLAMP = 6;

type Props = {
  children: string | null;
  lineClamp?: number;
};

function CollapsibleText({ children, lineClamp = DEFAULT_LINE_CLAMP }: Props) {
  const { t } = useTranslation();
  const { ref, expanded, toggle, isClamped } = useCollapsible<HTMLParagraphElement>(children);

  return (
    <Stack gap={4}>
      <Text ref={ref} lineClamp={expanded ? undefined : lineClamp}>
        {children}
      </Text>
      {(isClamped || expanded) && (
        <Anchor component="button" type="button" onClick={toggle} fw={500} lh={1} w="fit-content">
          {expanded ? t('collapse') : t('readInFull')}
        </Anchor>
      )}
    </Stack>
  );
}

export default CollapsibleText;

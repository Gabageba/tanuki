import { Badge, Stack, Text } from '@mantine/core';
import { TicketIcon } from '@phosphor-icons/react';
import { USER_ROLE } from '@tanuki/contracts';
import DrawerField from '@/shared/ui/DrawerField';
import RoleBadge from '../../../InvitesTable/components/RoleBadge';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import HeadingIcon from '../HeadingIcon';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

const TITLE = 'Приглашение от gabageba';

function InviteDrawerMock({ headerStyle }: Props) {
  return (
    <DrawerPanel
      title={
        headerStyle === HEADER_STYLE.UNIFORM || headerStyle === HEADER_STYLE.ENTITY_WITH_INVITE ? (
          <DrawerHeading
            icon={
              <HeadingIcon>
                <TicketIcon size={20} />
              </HeadingIcon>
            }
            title={TITLE}
            subtitle="K7F2-9QXA"
            isSubtitleMonospace
          />
        ) : (
          TITLE
        )
      }
    >
      <Stack gap="sm">
        <DrawerField label="Роль">
          <RoleBadge role={USER_ROLE.USER} />
        </DrawerField>
        <DrawerField label="Статус">
          <Badge variant="muted" color="teal">
            Активно
          </Badge>
        </DrawerField>
        <DrawerField label="Создано">
          <Text fz="sm" ff="monospace">
            01.10.2026
          </Text>
        </DrawerField>
      </Stack>
    </DrawerPanel>
  );
}

export default InviteDrawerMock;

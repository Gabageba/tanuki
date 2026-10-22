import { Accordion, Group } from '@mantine/core';
import { DOWNLOADED_TITLES } from '../mocks';
import DownloadedChapters from './DownloadedChapters';
import DownloadedTitleHeading from './DownloadedTitleHeading';
import DownloadedTitleMenu from './DownloadedTitleMenu';

type Props = {
  /** Раскрытый тайтл — например, при переходе с плашки. */
  defaultOpened?: string;
};

/** L1 — тайтлы строками, каждая раскрывается в свои главы на месте. */
function DownloadedAccordion({ defaultOpened = DOWNLOADED_TITLES[0]?.id }: Props) {
  return (
    <Accordion variant="contained" radius="md" chevronPosition="left" defaultValue={defaultOpened}>
      {DOWNLOADED_TITLES.map((title) => (
        <Accordion.Item key={title.id} value={title.id}>
          <Group gap={4} wrap="nowrap" pr="xs">
            <Accordion.Control miw={0} flex={1}>
              <DownloadedTitleHeading title={title} />
            </Accordion.Control>
            <DownloadedTitleMenu title={title} />
          </Group>
          <Accordion.Panel>
            <DownloadedChapters chapters={title.chapters} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export default DownloadedAccordion;

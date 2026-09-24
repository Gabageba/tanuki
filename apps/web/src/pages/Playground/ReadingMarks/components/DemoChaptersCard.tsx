import { Fragment, type ReactNode } from 'react';
import { Card } from '@mantine/core';
import type { Chapter } from '@tanuki/contracts';
import type { DemoState } from '../models';
import ApproximateLegend from './ApproximateLegend';

type Props = {
  demo: DemoState;
  renderRow: (chapter: Chapter, index: number) => ReactNode;
};

function DemoChaptersCard({ demo, renderRow }: Props) {
  return (
    <Card withBorder p={0} bg="transparent">
      {demo.withLegend && <ApproximateLegend approximateStyle={demo.approximateStyle} />}
      {demo.chapters.map((chapter, index) => (
        <Fragment key={chapter.id}>{renderRow(chapter, index)}</Fragment>
      ))}
    </Card>
  );
}

export default DemoChaptersCard;

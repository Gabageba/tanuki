import { Stack, Text } from '@mantine/core';
import { CONTENT_RATING } from '@tanuki/contracts';
import TitleAdultBadge from '@/entities/title/markers/TitleAdultBadge';
import TitleSourceRibbon from '@/entities/title/markers/TitleSourceRibbon';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import NumericMeta from '@/entities/title/NumericMeta';
import { BLUR_STYLE, type BlurStyle, type MockTitle } from '../models';
import MockCover from './MockCover';

type Props = {
  title: MockTitle;
  blurred: boolean;
  blurStyle?: BlurStyle;
};

/** Карточка каталога в сетке: те же метки, что у TitleGridCard, обложка сгенерирована. */
function MockGridCard({ title, blurred, blurStyle = BLUR_STYLE.PLAIN }: Props) {
  return (
    <Stack gap={8}>
      <MockCover title={title} blurred={blurred} blurStyle={blurStyle}>
        <TitleSourceRibbon sourceId={title.sourceId} />
        <TitleAdultBadge
          contentRating={title.isAdult ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE}
        />
      </MockCover>
      <Stack gap={4}>
        <TitleMetaItems
          gap={4}
          items={[
            title.type,
            <NumericMeta key="year">{title.year}</NumericMeta>,
            <NumericMeta key="volume">{title.chaptersCount}&nbsp;гл.</NumericMeta>,
          ]}
        />
        <Text lineClamp={2} lh={1} style={{ textWrap: 'balance' }}>
          {title.name}
        </Text>
      </Stack>
    </Stack>
  );
}

export default MockGridCard;

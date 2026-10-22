import { Divider, Grid } from '@mantine/core';
import TitleImageSectionSkeleton from './TitleImageSection/TitleImageSectionSkeleton';
import TitleDetailsSectionSkeleton from './TitleDetailsSection/TitleDetailsSectionSkeleton';

/** Страница тайтла, пока грузятся детали: обложка с кнопками и описание — скелетоном. */
function TitleSkeleton() {
  return (
    <Grid columnGap="lg">
      <TitleImageSectionSkeleton />
      <Divider orientation="vertical" visibleFrom="md" />
      <TitleDetailsSectionSkeleton />
    </Grid>
  );
}

export default TitleSkeleton;

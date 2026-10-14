import { useState } from 'react';
import { Stack, Switch } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import SelectionsMock from '../components/SelectionsMock';
import { SEL_MANGALIB } from '../mocks';
import { FINAL_LOOK } from '../models';

/** ★ Итог — выбранная комбинация, на блоке без фильтров и на «Сейчас читают» с периодом. */
function FinalSection() {
  const [failNextPageOnce, setFailNextPageOnce] = useState(false);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="★"
        title="Итог"
        description="Выбранные части вместе и живые: сверху «Горячие новинки» Реманги (листаются порциями, можно уронить следующую), снизу «Сейчас читают: новинки» MangaLib с периодом."
      />
      <DemoSection
        code="R1 + S2 + M1 + T1 + E2 + F1 + Z1a + H3 (кнопка «Каталог») + P2"
        title="Источник — заголовком-переключателем, блоки — вкладками, над сеткой — период и вид"
        description="В строке источника — заголовок, который открывает список источников (пункты как у остальных селектов: выбранный подсвечен рамкой и галочкой), и справа обычная кнопка «Каталог» с книгами. Ниже вкладки блоков с иконкой вида. Над сеткой панель: слева период полем (только у «Сейчас читают» MangaLib), справа сетка/список; на телефоне поле периода тянется на всю ширину, вид — справа в той же строке. Блок листается порциями, где сайт их даёт; конечный блок кончается строкой и ссылкой в каталог (E2). Упавшая порция — «Не удалось загрузить продолжение списка» с «Повторить загрузку списка» (F1) из PageLayout.InfiniteScrollTrigger, так же в каталоге и уведомлениях. У источника с одним блоком вкладка остаётся (Z1a)."
        pros={[
          'Каталог — у своего источника и выглядит кнопкой, а не подписью',
          'Всё, что меняет список, — в одной строке над ним',
          'Период полем не добавляет ряд — панель одной высоты на всех вкладках, и на телефоне тоже',
        ]}
        cons={[
          'У блоков без периода в панели только переключатель вида',
          'Нужен запрос на каждый блок, порции в парсерах и период у MangaLib',
        ]}
      >
        <SandboxOnly>
          <Switch
            label="Следующая порция падает один раз"
            checked={failNextPageOnce}
            onChange={(event) => setFailNextPageOnce(event.currentTarget.checked)}
          />
        </SandboxOnly>
        <Stack gap="lg">
          <VariantFrames
            key={String(failNextPageOnce)}
            desktopLabel="Десктоп · без фильтров"
            phoneLabel="375 px · без фильтров"
          >
            <SelectionsMock look={FINAL_LOOK} failNextPageOnce={failNextPageOnce} />
          </VariantFrames>
          <VariantFrames desktopLabel="Десктоп · с периодом" phoneLabel="375 px · с периодом">
            <SelectionsMock
              look={FINAL_LOOK}
              initialSourceId={SEL_MANGALIB.source.id}
              initialBlockId="readingNowNew"
            />
          </VariantFrames>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default FinalSection;

import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import Frames from '../../Notifications/components/Frames';
import DemoSection from '../../components/DemoSection';
import DownloadedBlock from '../components/DownloadedBlock';
import DownloadsPageMock from '../components/DownloadsPageMock';
import DownloadsTabs from '../components/DownloadsTabs';
import { DOWNLOADED_LAYOUT } from '../models';

/** L — скачанные тайтлы на странице «Загрузки». */
function DownloadedSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="L"
        title="Скачанные тайтлы"
        description="Пять тайтлов, одно длинное название, у «Поднятия уровня» глава 4 пропала у источника, но копия осталась. Корзина у главы удаляет её сразу; «Удалить скачанные главы тайтла» (в «⋯») и «Удалить все скачанные главы» открывают danger-модалку. Клик по главе ведёт в читалку."
      />
      <DemoSection
        code="L1"
        title="Раскрывающийся список"
        description="Тайтлы строками: обложка 40 px, название, источник, число глав и объём; строка раскрывается в главы прямо на месте. С плашки тайтла открывается уже раскрытой."
        pros={['Плотно — видно много тайтлов сразу', 'Без лишних экранов и drawer’ов']}
        cons={[
          'Тайтл с сотней глав раскрывается в длинную простыню',
          'Обложки мелкие — узнаёшь по названию',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <DownloadedBlock layout={DOWNLOADED_LAYOUT.ACCORDION} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="L2"
        title="Обложки и drawer"
        description="Сетка обложек, как в закладках; под каждой название, число глав и объём. Клик открывает drawer с главами — справа, на телефоне снизу (D1 drawer’ов)."
        pros={[
          'Похоже на библиотеку — узнаёшь по обложке',
          'Длинный список глав не раздувает страницу',
        ]}
        cons={[
          'Лишний шаг до главы',
          'Мета под обложкой мелкая',
          'Поверх очереди сетка выглядит тяжело',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <DownloadedBlock layout={DOWNLOADED_LAYOUT.GRID} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="L3"
        title="Две колонки"
        description="На десктопе слева тайтлы, справа главы выбранного; на телефоне — список и вложенный экран тайтла с «назад»."
        pros={['На десктопе видно и список, и главы без раскрытий']}
        cons={[
          'На телефоне это та же навигация, что в L2, только экраном',
          'Правая колонка пустая, пока тайтлов мало',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <DownloadedBlock layout={DOWNLOADED_LAYOUT.MASTER_DETAIL} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="L4"
        title="Очередь и скачанное вкладками"
        description="Две вкладки вместо двух блоков друг под другом; внутри «Скачанного» — раскрывающийся список, как в L1."
        pros={['Длинная очередь не выталкивает скачанное вниз', 'Каждая вкладка короче']}
        cons={[
          'Ошибки и пауза очереди не видны со «Скачанного»',
          'Пока очередь пуста, вкладка «Очередь» пустует',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <DownloadsTabs />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default DownloadedSection;

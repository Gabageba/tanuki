import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import ChaptersToolbarMock from '../components/ChaptersToolbarMock';
import PlateButton from '../components/PlateButton';
import PlateCard from '../components/PlateCard';
import PlateLegacy from '../components/PlateLegacy';
import PlateLine from '../components/PlateLine';
import PlateStatesGrid from '../components/PlateStatesGrid';
import TitleActionsMock from '../components/TitleActionsMock';
import { PLATE_STATE } from '../models';

/** B — плашка «Скачано N гл. · X МБ» на странице тайтла. */
function PlateSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="B"
        title="Плашка на тайтле"
        description="Колонка под обложкой: «Продолжить», папка, «…» (там теперь только «Поделиться») и плашка. Четыре состояния: всё скачано, качается 3 из 12, очередь на паузе, часть глав с ошибкой. Если у тайтла ничего не скачано и не стоит в очереди — плашки нет вовсе. Плашка ведёт к этому тайтлу на странице «Загрузки»."
      />
      <DemoSection
        code="B0"
        title="Как сейчас"
        description="Серая строка 12 px с иконкой диска — захардкожена и видна у любого тайтла."
        pros={['Тихая, не отвлекает от «Продолжить»']}
        cons={['Не ссылка, прогресса и ошибок нет', 'Иконка диска ничего не говорит о загрузке']}
      >
        <TitleActionsMock>
          <PlateLegacy />
        </TitleActionsMock>
      </DemoSection>
      <DemoSection
        code="B1"
        title="Строка-ссылка"
        description="Та же мелкая строка, но со значком состояния и шевроном — ведёт в «Загрузки». Пока глава качается, под строкой тонкая полоса прогресса тайтла."
        pros={['Почти не меняет колонку', 'Значки те же, что у строки главы (C1)']}
        cons={[
          '12 px легко пропустить, особенно ошибку',
          'Полоса на паузе отличается от активной только цветом',
        ]}
      >
        <PlateStatesGrid
          render={(state) => (
            <TitleActionsMock>
              <PlateLine state={state} />
            </TitleActionsMock>
          )}
        />
      </DemoSection>
      <DemoSection
        code="B2"
        title="Кнопка в ряду действий"
        description="Плашки нет — между папкой и «…» встаёт квадратная кнопка со значком состояния; числа в подсказке, клик ведёт в «Загрузки»."
        pros={['Колонка не растёт в высоту', 'Ошибка заметна красным значком прямо в ряду кнопок']}
        cons={[
          'Чисел без наведения не видно, на телефоне подсказки нет',
          'Поле папки становится уже',
        ]}
      >
        <PlateStatesGrid
          render={(state) => <TitleActionsMock rowButton={<PlateButton state={state} />} />}
        />
      </DemoSection>
      <DemoSection
        code="B3"
        title="Карточка с рамкой"
        description="Отдельный блок: значок, фраза, объём, полоса прогресса и кнопка «Открыть загрузки»."
        pros={['Заметно сразу, есть явное действие', 'Есть место под прогресс и причину']}
        cons={[
          'Тяжело под обложкой — особенно ради одной скачанной главы',
          'Спорит по весу с «Продолжить»',
        ]}
      >
        <PlateStatesGrid
          render={(state) => (
            <TitleActionsMock>
              <PlateCard state={state} />
            </TitleActionsMock>
          )}
        />
      </DemoSection>
      <DemoSection
        code="B4"
        title="В ряду над списком глав"
        description="Под обложкой ничего нет; та же строка-ссылка стоит над списком глав, рядом со «Скачать все»."
        pros={['Всё про скачивание в одном месте — у глав', 'Колонка под обложкой не меняется']}
        cons={[
          'Ряд привязан к ветке, а плашка считает весь тайтл',
          'Не видно с вкладки «Описание»',
          'На телефоне фраза режется: ряд и так занят сортировкой',
        ]}
      >
        <Stack gap="md" maw={640}>
          {Object.values(PLATE_STATE).map((state) => (
            <ChaptersToolbarMock key={state} state={state} />
          ))}
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default PlateSection;

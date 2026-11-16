import { useState } from 'react';
import { Button, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import SectionNav from '../components/SectionNav';
import {
  QUICK_CONFIRMATION_MODE,
  QUICK_VARIANTS,
  REVIEW_SECTIONS,
  SECTION_GROUPS,
  TAP_REVIEW_VARIANTS,
  TAP_REVIEW_MODE,
  BATCH_REVIEW_VARIANT,
  BATCH_PRESENTATION_VARIANTS,
  BATCH_REVIEW_PRESENTATION,
  FINAL_BATCH_REVIEW_VARIANT,
  REFINED_BATCH_REVIEW_VARIANT,
  VARIANTS,
} from './models';
import VariantFrames from './components/VariantFrames';
import ComparisonState from './components/ComparisonState';
import MatchesDemo from './components/MatchesDemo';
import QuickMatchesDemo from './components/QuickMatchesDemo';
import TapReviewDemo from './components/TapReviewDemo';

function PlaygroundTitleLinkConfirmation() {
  const [revision, setRevision] = useState(0);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Подтверждение связей</Title>
      </Group>
      <Stack gap="xs" maw={860}>
        <Text c="dimmed" fz="sm">
          Выбираем замену долгому нажатию, которое в Safari открывает предпросмотр ссылки. Карточка
          по-прежнему открывает тайтл. A1–A3 — первый проход: варианты отклонены как слишком
          сложные. Новый проход — B1–B8, затем B3a–B3f — доработка действий выбранного B3. В конце
          страницы — B3f1–B3f3 с прежней шириной и B3b1–B3b3 с прежней высотой карточки. Перейти к
          разделам можно через оглавление слева.
        </Text>
        <Text c="dimmed" fz="sm">
          Во всех примерах открыта страница «Поднятие уровня в одиночку». В B1–B8 решение
          принимается по обычной карточке, без отдельного сравнения. Если нужны подробности,
          карточка открывает тайтл, как в приложении. Решения действуют только внутри своего макета.
        </Text>
        <Text c="dimmed" fz="sm">
          Каждый вариант показан в ширине 880 и 375 px. В A2 и A3 нажмите «Сравнить», чтобы открыть
          окно. Смените тему в шапке песочницы. Данные и абстрактные обложки демонстрационные: один
          тайтл с разными обложками, спин-офф, длинное название и неполные сведения. В A0 сохранена
          текущая разметка. Всё без пометки «Только песочница» — интерфейс варианта.
        </Text>
      </Stack>
      <SandboxOnly>
        <Button
          variant="default"
          leftSection={<ArrowCounterClockwiseIcon />}
          onClick={() => setRevision((value) => value + 1)}
        >
          Сбросить решения во всех макетах
        </Button>
      </SandboxOnly>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack key={revision} gap="xl" flex={1} miw={0}>
          <Title order={3} id="axis-A">
            A · Где сравнивать тайтлы
          </Title>
          {VARIANTS.map(({ code, layout, ...props }) => (
            <DemoSection key={code} code={code} {...props}>
              <VariantFrames
                desktop={<MatchesDemo layout={layout} isPhone={false} />}
                phone={<MatchesDemo layout={layout} isPhone />}
              />
            </DemoSection>
          ))}
          <Divider />
          <Title order={3} id="axis-S">
            S · Содержимое и состояния сравнения
          </Title>
          <Text fz="sm" c="dimmed" maw={760}>
            Общее содержимое для A1–A3, здесь в ширине телефона. Раскройте подробности, проверьте
            длинное название и ручной переход после сохранения.
          </Text>
          <DemoSection
            code="S1"
            title="Неполные данные"
            description="Обложка совпала, но источник не отдал оригинальное название, автора, год и описание. Пробелы не означают, что это другое произведение."
            pros={['Известные данные остаются видны.']}
            cons={['Для уверенного решения иногда понадобится открыть тайтл.']}
          >
            <ComparisonState initialIndex={2} />
          </DemoSection>
          <DemoSection
            code="S2"
            title="Похожее длинное название"
            description="У кандидата длинное название и другие автор и описание. В карточке сохранено обычное ограничение названия на две строки."
            pros={['Различия можно проверить без выхода из сравнения.']}
            cons={['Длинные названия сдвигают действия ниже.']}
          >
            <ComparisonState initialIndex={4} />
          </DemoSection>
          <DemoSection
            code="S3"
            title="Сохранение решения"
            description="Во время запроса кнопки решения и перехода недоступны. Этот пример остаётся в состоянии сохранения; в A1–A3 оно длится около секунды."
            pros={['Повторное нажатие не отправляет второе решение.']}
            cons={['До завершения сохранения перейти к следующей паре нельзя.']}
          >
            <ComparisonState initialIndex={1} forcePending />
          </DemoSection>
          <Divider />
          <Title order={3} id="axis-B">
            B · Быстрое подтверждение
          </Title>
          <Text fz="sm" c="dimmed" maw={760}>
            Восемь сценариев на компонентах приложения. В B1 действия видны сразу, в B2 открываются
            кнопкой под кандидатом, в B3 включаются для всего блока, в B4 кандидаты собраны в
            вертикальный список. В B3 сначала нажмите «Проверить связи».
          </Text>
          <Text fz="sm" c="dimmed" maw={760}>
            B5 — одна панель решений под лентой, B6 — кнопки на обложке, B7 — раскрытие действий
            внутри карточки, B8 — выбор нескольких кандидатов и общее действие. Они добавлены после
            B1–B4; прежний порядок сохранён.
          </Text>
          {QUICK_VARIANTS.map(({ code, mode, ...props }) => (
            <DemoSection key={code} code={code} {...props}>
              <VariantFrames
                desktop={<QuickMatchesDemo mode={mode} isPhone={false} />}
                phone={<QuickMatchesDemo mode={mode} isPhone />}
              />
            </DemoSection>
          ))}
          {REVIEW_SECTIONS.map(({ letter, title, description, variants }) => (
            <Stack key={letter} gap="xl">
              <Divider />
              <Title order={3} id={`axis-${letter}`}>
                {letter} · {title}
              </Title>
              <Text fz="sm" c="dimmed" maw={760}>
                {description}
              </Text>
              {variants.map(({ code, actionLayout, ...props }) => (
                <DemoSection key={code} code={code} {...props}>
                  <VariantFrames
                    desktop={
                      <QuickMatchesDemo
                        mode={QUICK_CONFIRMATION_MODE.REVIEW}
                        actionLayout={actionLayout}
                        isPhone={false}
                      />
                    }
                    phone={
                      <QuickMatchesDemo
                        mode={QUICK_CONFIRMATION_MODE.REVIEW}
                        actionLayout={actionLayout}
                        isPhone
                      />
                    }
                  />
                </DemoSection>
              ))}
            </Stack>
          ))}
          <Divider />
          <Title order={3} id="axis-F">
            F · Проверка нажатием и выбором карточек
          </Title>
          <Text fz="sm" c="dimmed" maw={760}>
            Новый сценарий вместо постоянных действий у каждой карточки. В B9 и B10 сначала нажмите
            «Проверить связи», затем — на карточку. В B9 откроется меню, в B10 кандидат выделится, а
            действия появятся в заголовке. В обоих вариантах можно открыть тайтл отдельным
            действием. После завершения проверки карточки снова сразу открывают тайтл.
          </Text>
          {TAP_REVIEW_VARIANTS.map(({ code, mode, ...props }) => (
            <DemoSection key={code} code={code} {...props}>
              <VariantFrames
                desktop={<TapReviewDemo mode={mode} isPhone={false} />}
                phone={<TapReviewDemo mode={mode} isPhone />}
              />
            </DemoSection>
          ))}
          <DemoSection {...BATCH_REVIEW_VARIANT}>
            <VariantFrames
              desktop={<TapReviewDemo mode={TAP_REVIEW_MODE.BATCH} isPhone={false} />}
              phone={<TapReviewDemo mode={TAP_REVIEW_MODE.BATCH} isPhone />}
            />
          </DemoSection>
          <DemoSection {...REFINED_BATCH_REVIEW_VARIANT}>
            <VariantFrames
              desktop={
                <TapReviewDemo mode={TAP_REVIEW_MODE.BATCH} isPhone={false} refinedBatchActions />
              }
              phone={<TapReviewDemo mode={TAP_REVIEW_MODE.BATCH} isPhone refinedBatchActions />}
            />
          </DemoSection>
          {BATCH_PRESENTATION_VARIANTS.map(({ presentation, ...props }) => (
            <DemoSection key={props.code} {...props}>
              <VariantFrames
                desktop={
                  <TapReviewDemo
                    mode={TAP_REVIEW_MODE.BATCH}
                    isPhone={false}
                    refinedBatchActions
                    batchPresentation={presentation}
                  />
                }
                phone={
                  <TapReviewDemo
                    mode={TAP_REVIEW_MODE.BATCH}
                    isPhone
                    refinedBatchActions
                    batchPresentation={presentation}
                  />
                }
              />
            </DemoSection>
          ))}
          <Divider />
          <Title order={3} id="axis-G">
            G · Итог
          </Title>
          <DemoSection id="variant-B11b-result" {...FINAL_BATCH_REVIEW_VARIANT}>
            <VariantFrames
              desktop={
                <TapReviewDemo
                  mode={TAP_REVIEW_MODE.BATCH}
                  isPhone={false}
                  refinedBatchActions
                  batchPresentation={BATCH_REVIEW_PRESENTATION.DIVIDER}
                  hideUnselectedBatchActions
                />
              }
              phone={
                <TapReviewDemo
                  mode={TAP_REVIEW_MODE.BATCH}
                  isPhone
                  refinedBatchActions
                  batchPresentation={BATCH_REVIEW_PRESENTATION.DIVIDER}
                  hideUnselectedBatchActions
                />
              }
            />
          </DemoSection>
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundTitleLinkConfirmation;

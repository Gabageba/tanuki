import { useRef, useState } from 'react';
import { Box, Button, Checkbox, Group, Stack, Text } from '@mantine/core';
import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  BookOpenIcon,
  BookmarkSimpleIcon,
  CopyIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  SignOutIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { COPIED, ERROR, PARSER, RESTORE, SECURITY, UPDATE, WARNING } from '../mocks';
import {
  TOAST_KIND,
  VIEWPORT_CONTEXT,
  type DemoToast,
  type ToastAppearance,
  type ToastSample,
} from '../models';
import useToastDemo from '../hooks/useToastDemo';
import { getActionButtonProps } from '../lib';
import DemoToastItem from './DemoToastItem';
import ToastViewport from './ToastViewport';

type Props = {
  appearance?: Partial<ToastAppearance>;
  toastWidth?: number;
  gap?: number;
  showDesktop?: boolean;
  initialSamples?: ToastSample[];
};

function QueueDemo({
  appearance,
  toastWidth = 360,
  gap = 8,
  showDesktop = false,
  initialSamples = [],
}: Props) {
  const { state, running, setRunning, push, remove, setReader, pause, nextId, reset } =
    useToastDemo(initialSamples);
  const actionButtonProps = getActionButtonProps(appearance);
  const [failRestore, setFailRestore] = useState(false);
  const [result, setResult] = useState(
    initialSamples.length > 0
      ? 'Смешанный стек готов. Десктоп и телефон показывают одни сообщения: действия в любой рамке меняют обе. Таймеры запускаются отдельно.'
      : 'Очередь пуста. Таймеры запускаются отдельно; примеры можно рассмотреть без спешки.',
  );
  const [pwaDismissed, setPwaDismissed] = useState(false);
  const lastReadError = useRef(0);
  const readErrorClosed = useRef(false);

  const addOrdinary = () => {
    push({ ...COPIED, id: nextId() });
    setResult('Добавлен результат действия. Обычный тост может вытеснить старейший обычный.');
  };
  const addRestore = () => {
    const id = nextId();
    push({ ...RESTORE, id });
    setResult('Добавлена отдельная отмена на 10 с видимого показа.');
  };
  const addReadError = () => {
    const now = performance.now();
    if (readErrorClosed.current && now - lastReadError.current < 2000) {
      setResult(
        'Повтор того же сбоя подавлен: ещё не прошло 2 с с последнего принятого сообщения.',
      );
      return;
    }
    lastReadError.current = now;
    readErrorClosed.current = false;
    push({
      ...ERROR,
      id: 'read-error',
      title: 'Сервер недоступен',
      description: 'Не удалось загрузить данные. Попробуйте позже.',
    });
    setResult('Один и тот же сбой чтения обновляет существующее сообщение, не продлевая таймер.');
  };
  const close = (item: DemoToast) => {
    if (item.id === 'read-error') readErrorClosed.current = true;
    if (item.kind === TOAST_KIND.PWA) setPwaDismissed(true);
    remove(item.id);
    setResult(
      item.kind === TOAST_KIND.PWA
        ? 'Предложение PWA явно отклонено. Программное вытеснение этого не делает.'
        : 'Карточка закрыта; свободное место получает очередь.',
    );
  };
  const restore = (item: DemoToast) => {
    remove(item.id);
    if (failRestore) {
      push({ ...ERROR, id: nextId(), title: 'Не удалось вернуть закладку' });
      setResult('Исходная отмена закрыта до запроса. Показана одна отдельная ошибка.');
    } else setResult('Закладка возвращена. Исходная кнопка больше недоступна, тоста успеха нет.');
  };
  const loadProtected = () => {
    reset();
    setPwaDismissed(false);
    push({ ...RESTORE, id: nextId() });
    push({ ...SECURITY, id: nextId() });
    push({ ...RESTORE, id: nextId() });
    setResult(
      'Три защищённых сообщения: обычные будут ждать. Закройте карточку, чтобы увидеть следующий тост.',
    );
  };
  const loadReader = () => {
    reset();
    setReader(true);
    setPwaDismissed(false);
    [
      WARNING,
      PARSER,
      { ...WARNING, id: 'source-two', title: 'MangaLib недоступен' },
      { ...PARSER, id: 'parser-two', title: 'Парсер MangaLib остановился' },
    ].forEach(push);
    setResult(
      'Четыре фоновых события ждут выхода из читалки. Безопасность и результаты действий доступны сразу.',
    );
  };
  const getAction = (item: DemoToast) => {
    switch (item.kind) {
      case TOAST_KIND.RESTORE:
        return (
          <Button
            {...actionButtonProps}
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => restore(item)}
          >
            Вернуть закладку
          </Button>
        );
      case TOAST_KIND.PWA:
        return (
          <Button
            {...actionButtonProps}
            leftSection={<ArrowsClockwiseIcon />}
            onClick={() => {
              remove(item.id);
              setResult('Обновление запущено (демонстрация).');
            }}
          >
            Обновить приложение
          </Button>
        );
      case TOAST_KIND.EVENT:
      case TOAST_KIND.MESSAGE:
        return undefined;
    }
  };

  return (
    <Stack gap="md">
      <SandboxOnly>
        <Stack gap="sm">
          <Group gap="xs">
            <Button size="compact-sm" leftSection={<CopyIcon />} onClick={addOrdinary}>
              Результат действия
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<WarningCircleIcon />}
              onClick={addReadError}
            >
              Повторить сбой чтения
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<BookmarkSimpleIcon />}
              onClick={addRestore}
            >
              Удалить закладку
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<ShieldCheckIcon />}
              onClick={() => push({ ...SECURITY, id: nextId() })}
            >
              Событие безопасности
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<ArrowsClockwiseIcon />}
              onClick={() => {
                if (!pwaDismissed) push(UPDATE);
              }}
            >
              Предложить обновление
            </Button>
          </Group>
          <Group gap="xs">
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<ShieldCheckIcon />}
              onClick={loadProtected}
            >
              Три защищённых тоста
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<BookOpenIcon />}
              onClick={loadReader}
            >
              Четыре события во время чтения
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={state.reader ? <SignOutIcon /> : <BookOpenIcon />}
              onClick={() => setReader(!state.reader)}
            >
              {state.reader ? 'Выйти из читалки' : 'Войти в читалку'}
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={running ? <PauseIcon /> : <PlayIcon />}
              onClick={() => setRunning(!running)}
            >
              {running ? 'Остановить таймеры' : 'Запустить таймеры'}
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<ArrowCounterClockwiseIcon />}
              onClick={() => {
                reset();
                setPwaDismissed(false);
                readErrorClosed.current = false;
                setResult('Очередь очищена.');
              }}
            >
              Сбросить демонстрацию
            </Button>
          </Group>
          <Checkbox
            checked={failRestore}
            onChange={(event) => setFailRestore(event.currentTarget.checked)}
            label="Имитировать сбой возврата закладки"
          />
          <Text fz="sm" aria-live="polite">
            {result}
          </Text>
          <Text fz="xs" ff="monospace">
            Видно: {state.visible.length}/3 · Ожидает: {state.pending.length} · PWA отклонено:{' '}
            {pwaDismissed ? 'да' : 'нет'}
          </Text>
          {state.pending.length > 0 && (
            <Text fz="xs" c="dimmed">
              Очередь: {state.pending.map((item) => item.title).join(' → ')}
            </Text>
          )}
          {state.visible.map((item) => (
            <Text key={item.id} fz="xs" c="dimmed">
              {item.title}:{' '}
              {item.remaining === null ? 'постоянный' : `${Math.ceil(item.remaining / 1000)} с`}
              {state.hovered.includes(item.id) || state.focused.includes(item.id) ? ' · пауза' : ''}
            </Text>
          ))}
        </Stack>
      </SandboxOnly>
      <Group align="flex-start" gap="lg">
        {(showDesktop ? [false, true] : [true]).map((mobile) => (
          <ToastViewport
            key={String(mobile)}
            label={
              mobile
                ? state.reader
                  ? 'Читалка · телефон без нижней навигации'
                  : 'Телефон · над нижней навигацией'
                : `Десктоп · ${toastWidth} px · интервал ${gap} px`
            }
            mobile={mobile}
            context={state.reader ? VIEWPORT_CONTEXT.READER : VIEWPORT_CONTEXT.APP}
            height={580}
            toastWidth={toastWidth}
            gap={gap}
          >
            <Box
              role="region"
              aria-label={
                mobile
                  ? 'Демонстрация очереди сообщений на телефоне'
                  : 'Демонстрация очереди сообщений на десктопе'
              }
            >
              <Stack gap={gap}>
                {state.visible.map((item) => (
                  <DemoToastItem
                    key={item.id}
                    item={item}
                    appearance={appearance}
                    actions={getAction(item)}
                    onPause={pause}
                    announce={mobile}
                    onDismiss={() => close(item)}
                    onOpen={
                      item.kind === TOAST_KIND.EVENT
                        ? () => {
                            remove(item.id);
                            setResult('Открыта цель события; запись прочитана.');
                          }
                        : undefined
                    }
                  />
                ))}
              </Stack>
            </Box>
          </ToastViewport>
        ))}
      </Group>
      <SandboxOnly>
        <Text fz="xs" c="dimmed">
          Наведите мышь или переведите фокус на кнопку: отсчёт карточки остановится. Скрытая вкладка
          тоже приостанавливает таймеры. После выхода из читалки закройте один из трёх тостов:
          четвёртое событие получит свой показ.
        </Text>
      </SandboxOnly>
    </Stack>
  );
}

export default QueueDemo;

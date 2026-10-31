import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import CaptionedFrame from '../components/CaptionedFrame';
import ProfileRows from '../components/ProfileRows';
import { getProfileStateLabel } from '../lib';
import { PROFILE_STATE, PROFILE_VIEW, type ProfileState, type ProfileView } from '../models';

type VariantProps = {
  view: ProfileView;
  states: ProfileState[];
};

function ProfileVariant({ view, states }: VariantProps) {
  return (
    <Group align="flex-start" gap="lg">
      {states.map((state) => (
        <CaptionedFrame key={state} caption={getProfileStateLabel(state)}>
          <ProfileRows view={view} state={state} />
        </CaptionedFrame>
      ))}
      <CaptionedFrame caption="375 px">
        <ProfileRows view={view} state={PROFILE_STATE.IDLE} w={375} />
      </CaptionedFrame>
    </Group>
  );
}

/** R — строки блока «Импорт и экспорт» в «Профиль → Данные». */
function ProfileSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="R"
        title="Строки «Импорт и экспорт»"
        description="Тот же блок и порядок строк; «Импорт из источника» не меняется. «Скачать копию» сразу качает файл — без модалки и без тоста, пока сервер собирает его, в кнопке Loader. Без сети обе кнопки выключены."
      />
      <DemoSection
        code="R0"
        title="Как сейчас"
        description="«Экспорт закладок» открывает модалку выбора JSON/CSV, «Импорт закладок» — заглушку с моком."
        cons={[
          'Описание обещает «оценки и историю», которых в приложении нет',
          'Модалка выбора формата, хотя выбирать нечего: CSV обратно не загрузить',
          '«Импорт» трижды в одном блоке — не отличить копию от источника',
        ]}
      >
        <ProfileVariant view={PROFILE_VIEW.CURRENT} states={[PROFILE_STATE.IDLE]} />
      </DemoSection>
      <DemoSection
        code="R1"
        title="По плану, без даты"
        description="«Создать резервную копию» и «Восстановить из копии» — названия говорят о копии, а не об экспорте; описания — что в копии и что восстановление ничего не удаляет без спроса."
        pros={[
          'Ничего нового хранить на сервере не нужно',
          'Строки короче — на телефоне описание в две строки, а не в три',
        ]}
        cons={['Не видно, давно ли делали копию — об устаревшей никто не напомнит']}
      >
        <ProfileVariant
          view={PROFILE_VIEW.PLAN}
          states={[PROFILE_STATE.IDLE, PROFILE_STATE.DOWNLOADING, PROFILE_STATE.OFFLINE]}
        />
      </DemoSection>
      <DemoSection
        code="R2"
        title="С датой последней копии"
        description="То же, что R1, но в описании — «последняя — 2 дня назад» (formatRelative); пока копию не делали, хвоста нет."
        pros={['Напоминает, что копия устарела, — особенно перед переездом']}
        cons={[
          'Дату придётся хранить на сервере — нового поля в плане нет',
          'Считается и скачанная, но потерянная копия: «2 дня назад» может обмануть',
          'Описание длиннее — на телефоне три строки',
        ]}
      >
        <ProfileVariant
          view={PROFILE_VIEW.DATED}
          states={[PROFILE_STATE.IDLE, PROFILE_STATE.NEVER, PROFILE_STATE.OFFLINE]}
        />
      </DemoSection>
    </Stack>
  );
}

export default ProfileSection;

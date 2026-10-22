import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import ProfileStoragePair from '../components/ProfileStoragePair';
import { PROFILE_ROW } from '../models';

/** P — строка скачанного в «Профиль → Данные». */
function ProfileSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="P"
        title="Строка в профиле"
        description="Блок «Хранилище» в «Профиль → Данные». Строка показывает объём именно скачанного, ведёт в «Загрузки» и открывает danger-модалку «Удалить все скачанные главы»; если ничего не скачано — неактивна."
      />
      <DemoSection
        code="P0"
        title="Как сейчас"
        description="Описание — общий объём, занятый браузером, кнопка всегда неактивна."
        pros={['Одна строка']}
        cons={[
          'Объём не тот — это весь кеш, а не скачанные главы',
          'В «Загрузки» отсюда не попасть',
        ]}
      >
        <ProfileStoragePair variant={PROFILE_ROW.LEGACY} />
      </DemoSection>
      <DemoSection
        code="P1"
        title="Одна строка со ссылкой"
        description="В описании «42 гл. · 1,8 ГБ» и ссылка «Загрузки», справа «Удалить»."
        pros={['Блок не растёт', 'Объём и действие рядом']}
        cons={[
          'Ссылка 12 px в описании — мелкая цель для пальца',
          'Строка про удаление ведёт ещё и в загрузки — два смысла',
        ]}
      >
        <ProfileStoragePair variant={PROFILE_ROW.SINGLE} />
      </DemoSection>
      <DemoSection
        code="P2"
        title="Две строки"
        description="Отдельная строка «Загрузки» с объёмом и стрелкой; под ней «Удалить скачанные главы» с объяснением, что без сети их будет не прочитать."
        pros={[
          'Каждое действие своей строкой, у удаления — честное пояснение',
          'Вход в «Загрузки» крупный',
        ]}
        cons={['Блок «Хранилище» длиннее на строку', 'Объём не стоит рядом с кнопкой удаления']}
      >
        <ProfileStoragePair variant={PROFILE_ROW.SPLIT} />
      </DemoSection>
    </Stack>
  );
}

export default ProfileSection;

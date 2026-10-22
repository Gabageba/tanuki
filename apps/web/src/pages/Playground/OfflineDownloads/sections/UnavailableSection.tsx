import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import UnavailableTrio from '../components/UnavailableTrio';

/** U — что видно там, что без сети не открыть. */
function UnavailableSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="U"
        title="Недоступно без сети"
        description="Страница тайтла, которого нет в кеше; не скачанная глава в читалке; конец скачанной главы, когда следующая не скачана. Белого экрана нет нигде."
      />
      <DemoSection
        code="U1"
        title="С кнопкой «Открыть загрузки»"
        description="Причина и путь к тому, что можно прочитать прямо сейчас."
        pros={['Тупика нет — всегда есть куда пойти', 'Учит, что офлайн живёт в «Загрузках»']}
        cons={['Уводит со страницы, хотя сеть может вернуться через секунду']}
      >
        <UnavailableTrio withDownloadsLink />
      </DemoSection>
      <DemoSection
        code="U2"
        title="Откроется само"
        description="Только причина и обещание: страница сама перезапросится, когда вернётся сеть."
        pros={['Честно для метро: подождать — и всё откроется', 'Ничего лишнего на экране']}
        cons={[
          'В самолёте это тупик — куда идти, не сказано',
          'Нужно и правда перезапрашивать по online',
        ]}
      >
        <UnavailableTrio withDownloadsLink={false} />
      </DemoSection>
    </Stack>
  );
}

export default UnavailableSection;

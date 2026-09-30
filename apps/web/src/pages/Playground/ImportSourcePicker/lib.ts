import { ACCOUNT_STATE, type AccountState } from '../SourcesSetup/models';
import { DEMO_IMPORT_SOURCES, type DemoImportSource, type DemoNetwork } from './models';

/** Импортировать можно только оттуда, где вход выполнен. */
export const isImportAvailable = (source: DemoImportSource) =>
  source.state === ACCOUNT_STATE.ACTIVE;

export const AVAILABLE_SOURCES = DEMO_IMPORT_SOURCES.filter(isImportAvailable);

export const LOCKED_SOURCES = DEMO_IMPORT_SOURCES.filter((source) => !isImportAvailable(source));

/** Источники, собранные по сетям, в порядке первого появления сети. */
export const DEMO_NETWORKS = DEMO_IMPORT_SOURCES.reduce<DemoNetwork[]>((networks, source) => {
  const network = networks.find(({ title }) => title === source.network);
  if (network) {
    network.sources.push(source);
    return networks;
  }
  return [
    ...networks,
    { title: source.network, state: source.state, login: source.login, sources: [source] },
  ];
}, []);

/** Короткая подпись состояния — помещается и в плитку, и в строку карточки. */
export const getShortStateLabel = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return 'Вход не выполнен';
    case ACCOUNT_STATE.ACTIVE:
      return 'Вход выполнен';
    case ACCOUNT_STATE.RELOGIN:
      return 'Войдите заново';
  }
};

/** Что написано на кнопке входа; там, где вход выполнен, кнопки нет. */
export const getLoginActionLabel = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return 'Войти';
    case ACCOUNT_STATE.ACTIVE:
      return null;
    case ACCOUNT_STATE.RELOGIN:
      return 'Войти заново';
  }
};

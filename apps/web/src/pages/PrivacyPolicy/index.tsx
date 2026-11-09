import { useTranslation } from 'react-i18next';
import LegalDocument from '@/features/legal/LegalDocument';
import { ROUTE_PATHS } from '@/shared/lib/routes';

function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <LegalDocument
      title={t('dataProcessingPolicy')}
      sections={[
        {
          title: t('whoProcessesDataAndWhy'),
          paragraphs: [t('instanceAdministratorProcessesData'), t('dataUsedToProvideService')],
        },
        {
          title: t('whatDataIsStored'),
          paragraphs: [
            t('storedAccountData'),
            t('storedLibraryAndActivity'),
            t('storedSecurityData'),
          ],
        },
        {
          title: t('sourceAccounts'),
          paragraphs: [
            t('sourceCredentialsStoredEncrypted'),
            t('disconnectSourceToRemoveCredentials'),
          ],
        },
        {
          title: t('cookiesAndDeviceStorage'),
          paragraphs: [t('sessionCookiePurposeAndLifetime'), t('localStorageAndOfflineData')],
        },
        {
          title: t('whoCanAccessData'),
          paragraphs: [
            t('administratorAccessAndNoAdvertising'),
            t('externalServicesReceiveNecessaryData'),
          ],
        },
        {
          title: t('retentionAndDeletion'),
          paragraphs: [
            t('dataKeptWhileAccountExists'),
            t('accountDeletedAfterGracePeriod'),
            t('deviceCopiesAndServerBackups'),
          ],
        },
        {
          title: t('howToManageYourData'),
          paragraphs: [t('manageAndExportYourData'), t('requestDataAccessCorrectionOrDeletion')],
        },
        {
          title: t('policyChanges'),
          paragraphs: [t('currentPolicyPublishedHere')],
        },
      ]}
      relatedDocument={{ title: t('termsOfUse'), to: ROUTE_PATHS.TERMS }}
    />
  );
}

export default PrivacyPolicy;

import { useTranslation } from 'react-i18next';
import LegalDocument from '@/features/legal/LegalDocument';
import { ROUTE_PATHS } from '@/shared/lib/routes';

function Terms() {
  const { t } = useTranslation();

  return (
    <LegalDocument
      title={t('termsOfUse')}
      sections={[
        {
          title: t('aboutTheService'),
          paragraphs: [t('tanukiHelpsReadFromSources'), t('termsApplyToThisInstance')],
        },
        {
          title: t('account'),
          paragraphs: [t('registrationByInvitation'), t('keepAccountAccessSecure')],
        },
        {
          title: t('contentAndRights'),
          paragraphs: [t('contentBelongsToRightsHolders'), t('useContentWithinApplicableRules')],
        },
        {
          title: t('adultContent'),
          paragraphs: [t('adultContentRequiresAgeConfirmation')],
        },
        {
          title: t('usageRules'),
          paragraphs: [
            t('doNotDisruptServiceOrAccessOthersData'),
            t('accessMayBeRestrictedForAbuse'),
          ],
        },
        {
          title: t('availabilityAndDataPreservation'),
          paragraphs: [t('availabilityDependsOnSources'), t('keepYourOwnLibraryBackup')],
        },
        {
          title: t('endingUseAndChanges'),
          paragraphs: [t('youCanDeleteYourAccount'), t('currentTermsPublishedHere')],
        },
      ]}
      relatedDocument={{ title: t('dataProcessingPolicy'), to: ROUTE_PATHS.PRIVACY_POLICY }}
    />
  );
}

export default Terms;

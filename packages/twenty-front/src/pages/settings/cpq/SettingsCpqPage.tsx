import { useLingui } from '@lingui/react/macro';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { CpqSetupPage } from '@/cpq/components/CpqSetupPage';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

// Entry point for the CPQ settings section.
// After CPQ is set up, custom objects (Quotes, Contracts, etc.) appear
// natively in the sidebar — this page manages that lifecycle.
export const SettingsCpqPage = () => {
  const { t } = useLingui();

  return (
    <SubMenuTopBarContainer
      title={t`CPQ`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: t`CPQ` },
      ]}
    >
      <SettingsPageContainer>
        <CpqSetupPage />
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};

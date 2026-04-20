import { useLingui } from '@lingui/react/macro';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { CpqSetupPage } from '@/cpq/components/CpqSetupPage';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const SettingsCpq = () => {
  const { t } = useLingui();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

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
      {currentWorkspace ? <CpqSetupPage workspaceId={currentWorkspace.id} /> : <></>}
    </SubMenuTopBarContainer>
  );
};

import { Helmet } from 'react-helmet-async';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { CpqSetupPage } from 'src/modules/cpq/components/CpqSetupPage';

export const SettingsCpqPage = () => {
  return (
    <>
      <Helmet>
        <title>CPQ Settings · Twenty</title>
      </Helmet>
      <SubMenuTopBarContainer
        title="CPQ"
        links={[
          { children: 'Settings', href: '/settings' },
          { children: 'CPQ' },
        ]}
      >
        <CpqSetupPage />
      </SubMenuTopBarContainer>
    </>
  );
};

import { gql } from '@apollo/client';

export const RUN_RENEWAL_CHECK = gql`
  mutation RunRenewalCheck {
    runRenewalCheck {
      contractsScanned
      renewalsCreated
      errors
      status
    }
  }
`;

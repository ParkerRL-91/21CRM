import { gql } from '@apollo/client';

export const TEARDOWN_CPQ = gql`
  mutation TeardownCpq {
    teardownCpq {
      objectsRemoved
      errors
    }
  }
`;

import { gql } from '@apollo/client';

export const SETUP_CPQ = gql`
  mutation SetupCpq {
    setupCpq {
      objectsCreated
      fieldsCreated
      relationsCreated
      skipped
      errors
    }
  }
`;

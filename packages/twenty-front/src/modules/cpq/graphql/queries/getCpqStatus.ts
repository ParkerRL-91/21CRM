import { gql } from '@apollo/client';

export const GET_CPQ_STATUS = gql`
  query GetCpqStatus {
    cpqStatus {
      isSetUp
      objectCount
      expectedCount
      foundObjects
      missingObjects
      version
    }
  }
`;

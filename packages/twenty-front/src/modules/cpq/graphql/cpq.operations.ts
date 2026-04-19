import { gql } from '@apollo/client';

export const GET_CPQ_STATUS = gql`
  query CpqStatus {
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

export const CALCULATE_PRICE = gql`
  mutation CalculatePrice($input: CalculatePriceInput!) {
    calculatePrice(input: $input) {
      netUnitPrice
      netTotal
      listPrice
      auditSteps
    }
  }
`;

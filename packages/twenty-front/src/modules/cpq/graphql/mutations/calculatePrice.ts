import { gql } from '@apollo/client';

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

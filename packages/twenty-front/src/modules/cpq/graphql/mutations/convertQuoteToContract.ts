import { gql } from '@apollo/client';

export const CONVERT_QUOTE_TO_CONTRACT = gql`
  mutation ConvertQuoteToContract($quoteId: String!) {
    convertQuoteToContract(quoteId: $quoteId) {
      contractId
    }
  }
`;

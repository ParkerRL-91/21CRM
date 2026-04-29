import { gql } from '@apollo/client';

// For now, define stub GraphQL operations that document the intended API
// The actual migration to GraphQL resolvers is a backend task

export const CPQ_STATUS_QUERY = gql`
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

export const CPQ_CALCULATE_PRICE_MUTATION = gql`
  mutation CalculatePrice($input: CalculatePriceInput!) {
    calculatePrice(input: $input) {
      netUnitPrice
      netTotal
      listPrice
      auditSteps {
        ruleName
        inputPrice
        outputPrice
        parameters
        timestamp
      }
    }
  }
`;

export const CPQ_SETUP_MUTATION = gql`
  mutation SetupCpq {
    setupCpq {
      objectCount
      errors
    }
  }
`;

export const CPQ_TEARDOWN_MUTATION = gql`
  mutation TeardownCpq {
    teardownCpq {
      removedCount
    }
  }
`;

export const CPQ_SEED_CATALOG_MUTATION = gql`
  mutation SeedCatalog($products: [ProductSeedInput!]!) {
    seedCatalog(products: $products) {
      created
      skipped
      errors
    }
  }
`;

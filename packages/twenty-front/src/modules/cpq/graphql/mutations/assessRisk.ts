import { gql } from '@apollo/client';

export const ASSESS_RISK = gql`
  mutation AssessRisk($input: AssessRiskInput!) {
    assessRisk(input: $input) {
      overallScore
      riskLevel
      signals {
        name
        weight
        score
        description
      }
      assessedAt
    }
  }
`;

import { Field, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class PricingResultOutput {
  @Field(() => String)
  netUnitPrice: string;

  @Field(() => String)
  netTotal: string;

  @Field(() => String)
  listPrice: string;

  // Full step-by-step audit trail serialized as JSON
  @Field(() => GraphQLJSON)
  auditSteps: object[];
}

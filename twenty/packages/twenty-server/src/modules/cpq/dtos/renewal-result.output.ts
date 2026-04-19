import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RenewalJobResultOutput {
  @Field(() => Int)
  contractsScanned: number;

  @Field(() => Int)
  renewalsCreated: number;

  @Field(() => [String])
  errors: string[];

  @Field(() => String)
  status: string;
}

@ObjectType()
export class ConvertQuoteOutput {
  @Field(() => String)
  contractId: string;
}

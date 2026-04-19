import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AssessRiskInput {
  @Field(() => Int)
  daysSinceLastStageChange: number;

  @Field(() => String)
  dealCloseDate: string;

  @Field(() => String)
  contractEndDate: string;

  @Field(() => Int)
  daysUntilExpiry: number;

  @Field(() => Boolean)
  inFinalStage: boolean;

  @Field(() => Float)
  currentValue: number;

  @Field(() => Float)
  proposedValue: number;

  @Field(() => Int)
  daysSinceLastActivity: number;

  @Field(() => Boolean)
  hasPreviousChurn: boolean;
}

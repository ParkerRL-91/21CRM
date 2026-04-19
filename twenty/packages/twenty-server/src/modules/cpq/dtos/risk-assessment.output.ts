import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RiskSignalOutput {
  @Field(() => String)
  name: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  score: number;

  @Field(() => String)
  description: string;
}

@ObjectType()
export class RiskAssessmentOutput {
  @Field(() => Int)
  overallScore: number;

  @Field(() => String)
  riskLevel: string;

  @Field(() => [RiskSignalOutput])
  signals: RiskSignalOutput[];

  @Field(() => String)
  assessedAt: string;
}
